/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState, useEffect, useRef } from 'react';
import { Button, Dimensions, TouchableOpacity } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";
import  WebView from "react-native-webview"
import Modal from "react-native-modal";
import * as Animatable from 'react-native-animatable';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Pressable,
  TouchableWithoutFeedback,
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
import { Float } from 'react-native/Libraries/Types/CodegenTypes';
import Icon from 'react-native-vector-icons/FontAwesome';

const youtubeHeight = Dimensions.get('window').width / 16 * 9;

function App(): JSX.Element {
  type YoutubeResponse = {
    caption: {

    },
    translate_caption: {

    }
  }
  type YoutubeCaption = {
    start:string,
    end: string,
    duration: string,
    text: string
  }
  const playerRef: any = useRef();
  //ステータス関係
  const [videoId, setVideoId] = useState("lhr4Ax4C_-4"); //youtubeのvideoId
  /* videoStatus
  unstarted 未開始
  video cue 次のビデオキュー
  buffering　現在のビデオは再生状態ですが、バッファリングのために停止しています
  playing　再生中
  paused	一時停止
  ended 再生終了
  */
  const [videoStatus, setVideoStatus] = useState<string>("playing") // ビデオ開始停止
  const [viewModal, setViewModal] = useState(false) //モーダル開閉

  //字幕関係
  const [captions, setCaptions] = useState<any>([]);
  const [captionTexts, setCaptionTexts] = useState([])
  const [translatedCaptions, setTranslatedCaptions] = useState([])
  const [currCaptionIndex, setCurrCaptionIndex] = useState<number | null>(null); // 字幕全体に対する配列のIndex
  const [currCaptions, setCurrCaptions] = useState(Array<Object>) // 現在再生している字幕情報
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [pressedVideo, setPressedVideo] = useState<boolean>(false)

  //モーダル関係内容
  const [translatedCaption, setTranslatedCaption] = useState<any>();
  const [sourceText, setSourceText] = useState<string | null>("environment") // ビデオ字幕の翻訳対象文字
  const [sourceTextId, setSourceTextId] = useState(null) // ビデオ字幕の翻訳
  const [videoCaptionInfo, setVideoCaptionInfo] = useState<any>()
  
  
  // TODO: URL系は環境変数で管理する。
  const [googleTranslateUrl, setGoogleTranslateUrl] = useState("https://script.google.com/macros/s/AKfycbyNX-jodYhhZESYMQ9hzDxtzRgs_y4nWgGGFGNB1A8rR_Y9Kn1w1djVZtv1pGKAvA4f/exec")

  
  
  // const [charCaption, setCharCaption] = useState(Array<Array<String>>) この機能の実装はまだ先

  useEffect(() => {
    const fetchYoutubecaptions = async () => { 
      const response = await fetch('http://localhost:9000/2015-03-31/functions/function/invocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoId
        }),
      });
      const data = await response.json().then((data) => {
        return JSON.parse(data.body);
      });
      setCaptions(JSON.parse(data.caption));
      setTranslatedCaptions(JSON.parse(data.translate_caption))
    }

    fetchYoutubecaptions();
    const timer = setInterval(async () => {
      const newTime: any = await playerRef.current?.getCurrentTime();
      if (newTime !== currentTime) {
        setCurrentTime(newTime);
      }
    }, 500); // 0.5秒ごとに監視
  }, []); // 依存配列を空にする

  useEffect(() => {
    if(!viewModal) getCurrCaption();
  }, [currentTime])

  function splitCaptionText(subtitles: any) {
    const splitTexts = subtitles.map(function(subtitle: any) {
      const texts = subtitle.text.split(" ");
      return texts;
    })
    setCaptionTexts(splitTexts)
  }
  function getCurrCaption() {
    if(captions.length > 0 && currentTime) {
      const fetchedCurrCaptions: any = captions.filter(function(caption: any) {
        const startTime = parseFloat(caption.start);
        const endTime = parseFloat(startTime + caption.duration);

        return startTime <= currentTime && currentTime < endTime;
      })
      setCurrCaptions(fetchedCurrCaptions);
      // setCurrCaptionIndex(currCaptions.index);
      if(fetchedCurrCaptions){
        splitCaptionText(fetchedCurrCaptions)
      }
    }
  }

  const hiddenTranslate = () => {
    setSourceText(null)
    setVideoCaptionInfo(null)
    setTranslatedCaption(null)
    // setsourceTextId(null)
    setViewModal(false)
    setVideoStatus('playing')
  }

  const textDictional = async (text: string) => {
    const url = `https://api.excelapi.org/dictionary/enja?word=${text}`

    const response = axios.get(url)
    .then((res: any) => {
      let stringJson: any = JSON.stringify(res.data)
      // return stringJson
      stringJson = stringJson.replace(/[";]/g, "")
      stringJson = stringJson.replace("/", 2);

      setVideoCaptionInfo(stringJson)
    })
    return response
  }

  const translate = (text: string) => {
    // Youtubeの自動翻訳を使えるので不要に
    // const url = "https://mt-auto-minhon-mlt.ucri.jgn-x.jp"
    // const key = "19c61daea69c34114464b373d74f2928064e94fd6"
    // const secret = "62c50964289e1e289de36c243098641d"
    // const name = "kyamada2001"
    // const api_name = "mt"
    // const api_param = "generalNT_en_ja"

    // // みんなの翻訳APIにてoauthが必要になったらコメント解除
    // // const getClientCredentials =  oauth.clientCredentials(
    // //   axios.create(),
    // //   url + '/oauth2/token.php',
    // //   key,
    // //   secret,
    // // );
    // // const auth: any = await getClientCredentials

    // const response = axios.post(`${url}/api/?access_token=null&key=${key}&api_name=${api_name}&api_param=${api_param}&name=${name}&type=json&text=${text}`)
    // .then((res: any) => {
    //   const text = res.data.resultset.result.text
    //   const convertedText = text.replace(/;/g, "\n").replace(/"/g, "");
    //   setTranslatedCaption(convertedText)
    // }).catch((err) => {
    //   const stringJson: any = JSON.stringify(err)
    //   // setVideoCaptionInfo(stringJson)
    // })
    // return response;
  }

  const getCurrTranslateCaption = (currCaptionIndex: any) => {
    const sourceCaption: any = currCaptions[currCaptionIndex];
    const startTime = sourceCaption.start;
    const duration = sourceCaption.duration;

    const translated: any = translatedCaptions.filter(function(element: any) {
      return startTime == element.start && duration == element.duration
    })
    setTranslatedCaption(translated[0]);
  }

  const pressVideoCaption = async (currCaptionIndex: any, captionText: any) => {
      hiddenTranslate();
    // text指定する際、caption.textと指定する必要がある。
    new Promise(async function(resolve, reject){
      setVideoStatus("paused")
      setSourceText(captionText)
      // setSourceTextId(captionId)
      await textDictional(captionText) //.then((dictionaryText) => setVideoCaptionInfo(dictionaryText))
      getCurrTranslateCaption(currCaptionIndex) // 表示されている字幕のIndexを渡し、字幕をセットする
      // setViewModal(true)
      resolve(null)
    }).then(() => {
      // 全ての処理が終わってからモーダル表示する
      setViewModal(true)
    }).catch((err) => {
      setTranslatedCaption(err)
      setViewModal(true)
    })
    
    // TODO: 時間で、currCaptionとあう要素を検索し、翻訳を取得する
  }


  function pressVideoFrame() {
    setPressedVideo(true)
    setTimeout(() => {
      setPressedVideo(false)
    }, 4000);
  }
  

  const VideoCaptionInfo = () => {
    if(!viewModal) return;
    const newlineStrings = videoCaptionInfo.split('/', 3);
    // const Dictionary = newlineStrings.map((newlineString: any, index: any) => {
    //   // return (
    //   //   <>
    //   //     {newlineString}
    //   //     {index < newlineStrings.length - 1 ? '\n' : null}
    //   //   </>
    //   // );
    //   <Text>あ</Text>
    // })// 改行するコンポーネントを作成
    return (
        <Modal isVisible={viewModal}>
          <Button title="close" onPress={hiddenTranslate}/>
          <View style={styles.padding10}>
            <View style={styles.overlayHead}>
              <Text style={styles.originalWord}>{sourceText}</Text>
              <View>
                {
                  newlineStrings.map((newlineString: any, index: any) => {
                    return (
                    <Text style={styles.dictionaryInfo}>
                      {newlineString}
                      {index < newlineStrings.length - 1 ? '\n' : null}
                    </Text>
                    )
                  })
                }
              </View>
            </View>
            <View style={styles.overlayBody}>
              <Text style={styles.originalWord}>現在の字幕</Text>
              <Text style={styles.originalWord}>{translatedCaption ? translatedCaption.text : ''}</Text>
            </View>
            <View>
              <Text>{JSON.stringify(captionTexts ?? '')}</Text>
            </View>
          </View>
        </Modal>
    )
  }
  const videoPlaying = (): boolean => {
    if(videoStatus == 'playing' || videoStatus == 'buffering') return true;
    else return false;
  }

  return (
    <SafeAreaView>
      <StatusBar/>
        {/* 字幕をクリックした際、(pressVideoCaption発火時)、WebViewで翻訳を表示する */}
      <VideoCaptionInfo/>
      <View>
        <Pressable onPress={pressVideoFrame}>
          <YoutubePlayer
            ref={playerRef}
            height={youtubeHeight}
            play={videoPlaying()}
            videoId={videoId}
            onChangeState={(e: any) => setVideoStatus(e)}
            // onChangeState={}
          />
        </Pressable>
        <View style={[styles.overlay, pressedVideo || videoStatus == 'paused' ? styles.overlayPress : styles.overlayNotPress]}>
          {
            currCaptions ?
            captionTexts.map((texts: any, currCaptionIndex: any) => (
              <>
              <View style={styles.captionContainer}>
                {
                  texts.map((text: any, index: any) => {
                    return (
                      <TouchableOpacity onPress={() => pressVideoCaption(currCaptionIndex, text)}>
                        <Text style={styles.overlayText} key={index}>{text}</Text>
                      </TouchableOpacity>
                    )
                  })
                }
              </View>
              </>
            )) : null
          }
        </View>
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
      >
        <View>
          {
            captions.length > 0 ?
            captions.map((subtitle: any, index: any) => (
              <View style={styles.captions}>
                <View style={styles.playbackIcon}>
                  <Icon name='volume-up'></Icon>
                </View>
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
    marginRight: 4,
  },
  captionContainer: {
    flexDirection: 'row'
  },
  captions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start', // 左揃え
    alignItems: 'center', 
    paddingBottom: 20,
    borderWidth: 1,
    borderBottomColor: 'black',
  },
  playbackIcon: {
    flex: 1,
    padding: 4
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
  zIndex100: {
    zIndex: 100,
  },
  padding10: {
    padding: 10
  }
});
export default App;