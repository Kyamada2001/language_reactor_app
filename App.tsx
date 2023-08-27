/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";
import  WebView from "react-native-webview"
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Pressable
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import oauth from 'axios-oauth-client'

const youtubeHeight = Dimensions.get('window').width / 16 * 9;
const translateJsonData = require('./assets/language/en_to_ja.json')

function App(): JSX.Element {
  const playerRef: any = useRef();
  const [subtitles, setSubtitles] = useState([]);
  const [videoId, setVideoId] = useState("lhr4Ax4C_-4");
  // TODO: URL系は環境変数で管理する。
  const [googleTranslateUrl, setGoogleTranslateUrl] = useState("https://script.google.com/macros/s/AKfycbyNX-jodYhhZESYMQ9hzDxtzRgs_y4nWgGGFGNB1A8rR_Y9Kn1w1djVZtv1pGKAvA4f/exec")

  const [captionIndex, setCaptionIndex] = useState<number | null>(null); // 字幕全体に対する配列のIndex
  const [currCaptions, setCurrCaptions] = useState(Array<Object>) // 現在再生している字幕情報
  // const [charCaption, setCharCaption] = useState(Array<Array<String>>) この機能の実装はまだ先
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [pressedVideo, setPressedVideo] = useState(Boolean)

  const [sourceVideoCaption, setSourceVideoCaption] = useState<string | null>("environment") // ビデオ字幕の翻訳対象文字
  const [sourceVideoCaptionId, setSourceVideoCaptionId] = useState(null) // ビデオ字幕の翻訳
  const [videoCaptionInfo, setVideoCaptionInfo] = useState("")
  const [translatedCaption, setTranslatedCaption] = useState("")

  useEffect(() => {
    console.log("デバッガー発火")
    const fetchYoutubeSubtitles = async () => { 
      const response = await fetch('http://localhost:9000/2015-03-31/functions/function/invocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoId
        }),
      });
      const subtitles = await response.json().then((data) => {
        return JSON.parse(data.body);
      });
      setSubtitles(subtitles[0]);
    }

    fetchYoutubeSubtitles();
    const timer = setInterval(async () => {
      const newTime: any = await playerRef.current?.getCurrentTime();
      if (newTime !== currentTime) {
        setCurrentTime(newTime);
      }
    }, 500); // 0.5秒ごとに監視
  }, []); // 依存配列を空にする

  useEffect(() => {
    getCurrCaption();
  }, [currentTime])

  function getCurrCaption() {
    if(subtitles.length > 0 && currentTime) {
      const currCaptions: any = subtitles.filter(function(subtitle: any) {
        const startTime = parseFloat(subtitle.start);
        const endTime = parseFloat(startTime + subtitle.duration);

        return startTime <= currentTime && currentTime < endTime; 
      })
      setCurrCaptions(currCaptions);
    }
  }

  const hiddenTranslate = () => {
    setSourceVideoCaption(null)
    setSourceVideoCaptionId(null)
  }

  const textDictional = async (text: string) => {
    const url = "https://api.excelapi.org/dictionary/enja?word=pretty"

    const response = await axios.get(url)
    .then((res: any) => {
      const stringJson: any = JSON.stringify(res.data)
      return stringJson
      // setVideoCaptionInfo(stringJson)
    })
    return response
  }

  const translate = async (text: string) => {
    const url = "https://mt-auto-minhon-mlt.ucri.jgn-x.jp"
    const key = "19c61daea69c34114464b373d74f2928064e94fd6"
    const secret = "62c50964289e1e289de36c243098641d"
    const name = "kyamada2001"
    const api_name = "mt"
    const api_param = "generalNT_en_ja"

    // oauthが必要になったらコメント解除
    // const getClientCredentials =  oauth.clientCredentials(
    //   axios.create(),
    //   url + '/oauth2/token.php',
    //   key,
    //   secret,
    // );
    // const auth: any = await getClientCredentials

    const response = await axios.post(`${url}/api/?access_token=null&key=${key}&api_name=${api_name}&api_param=${api_param}&name=${name}&type=json&text=${text}`)
    .then((res: any) => {
      const text = res.data.resultset.result.text
      const convertedText = text.replace(/;/g, "\n").replace(/"/g, "");
      return convertedText;
      // setVideoCaptionInfo(res.data.resultset.result.text)
    }).catch((err) => {
      const stringJson: any = JSON.stringify(err)
      // setVideoCaptionInfo(stringJson)
    })
    return response;
  }

  const pressVideoCaption = async (captionId: any, caption: string) => {
    if (captionId == sourceVideoCaptionId) {
      hiddenTranslate();
    } else {
      setSourceVideoCaption("caption")
      setSourceVideoCaptionId(captionId)
      
      const dictionaryText: any = await textDictional("Hello")
      const translated = await translate(caption);

      setVideoCaptionInfo(dictionaryText)
      setTranslatedCaption(translated)
    }
  }


  function pressVideoFrame() {
    setPressedVideo(true)
    setTimeout(() => {
      setPressedVideo(false)
    }, 4000);
  }
  

  const VideoCaptionInfo = () => {
    return (
      <View style={styles.translateVideoCaption}>
        <View style={styles.overlayHead}>
          <Text style={styles.originalWord}>{sourceVideoCaption}</Text>
          <Text style={styles.dictionaryInfo}>{videoCaptionInfo}</Text>
        </View>
        <View style={styles.overlayBody}>
          <Text style={styles.originalWord}>現在のテキスト</Text>
          <Text style={styles.originalWord}>{translatedCaption}</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView>
      <StatusBar/>
      <View>
        <Pressable
          onPress={pressVideoFrame}>
          <YoutubePlayer
            ref={playerRef}
            height={youtubeHeight}
            play={true}
            videoId={videoId}
            // onChangeState={}
          />
        </Pressable>
        {/* 字幕をクリックした際、(pressVideoCaption発火時)、WebViewで翻訳を表示する */}
        {
          videoCaptionInfo ?
          <VideoCaptionInfo/>
          : null
        }

        <View style={[styles.overlay, pressedVideo ? styles.overlayPress : styles.overlayNotPress]}>
          {
            currCaptions ?
            currCaptions.map((caption: any, index: any) => (
              <TouchableOpacity onPress={() => pressVideoCaption(index, caption.text)}>
                <Text style={styles.overlayText} key={index}>{caption.text}</Text>
              </TouchableOpacity>
            )) : null
          }
        </View>
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
      >
        <View>
          {
            subtitles.length > 0 ?
            subtitles.map((subtitle: any, index: any) => (
              <View style={styles.captions}>
                <Text style={styles.captionText} key={index}>{subtitle.text}</Text>
              </View>
            ))
            : <Text>字幕を表示中です。</Text>
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', // 必要に応じて調整
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 5,
    opacity: 0.8,
  },
  overlayPress: {
    bottom: '30%', // 画面下からの距離を調整
  },
  overlayNotPress: {
    bottom: '10%', // 画面下からの距離を調整
  },
  overlayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  captions: {
    justifyContent: 'center',
    paddingBottom: 20,
    borderWidth: 1,
    borderBottomColor: 'black',
  },
  captionText: {
    zIndex: 10,
    flex:1,
    fontSize: 18,
    marginLeft: 5,
  },
  // Video字幕翻訳
  translateVideoCaption: {
    flex: 1,
    // width: '85%',
    height: '50%',
    top: '7%',
    // bottom: '40%',
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 5,
    borderBottomColor: 'black',
    // transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  overlayHead: {
    backgroundColor: 'dodgerblue',
    width: '100%',
  },
  overlayBody: {
    backgroundColor: 'rebeccapurple',
    width: '100%',
  },
  originalWord: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'gold',
  },
  dictionaryInfo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  videoCaptionTranslateView: {
    flex: 1,
    zIndex: 100,
    // width: '100%'
  },
});
export default App;
