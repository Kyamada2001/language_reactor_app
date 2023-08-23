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

const youtubeHeight = Dimensions.get('window').width / 16 * 9;

function App(): JSX.Element {
  const playerRef: any = useRef();
  const [subtitles, setSubtitles] = useState([]);
  const [videoId, setVideoId] = useState("lhr4Ax4C_-4");

  const [captionIndex, setCaptionIndex] = useState(Number);
  const [currCaptions, setCurrCaptions] = useState(Array<Object>)
  // const [charCaption, setCharCaption] = useState(Array<Array<String>>) この機能の実装はまだ先
  const [currentTime, setCurrentTime] = useState(Number);
  const [pressedVideo, setPressedVideo] = useState(Boolean)
  const [translateWord, setTranslateWord] = useState(null)
  const [translateWordId, setTranslateWordId] = useState(null)

  useEffect(() => {
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

  const pressVideoCaption = (captionId: any, caption: any) => {
    if(!translateWordId || translateWordId != captionId){
      setTranslateWord(caption)
      setTranslateWordId(captionId)
    } else if(captionId == translateWordId) {
      setTranslateWord(null)
      setTranslateWordId(null)
    }
  }

  function pressVideoFrame() {
    setPressedVideo(true)
    setTimeout(() => {
      setPressedVideo(false)
    }, 4000);
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
        {/* 字幕をクリックした際、(pressVideoCaptionクリック時)、WebViewで翻訳を表示する */}
        {/* {translateWordId && translateWord ?  */}
        {/* : null} */}

        <View style={styles.translateVideoCaption}>
           <TouchableOpacity>
            <Text>WebView表示</Text>
             <WebView 
                style={styles.videoCaptionTranslateView} 
                source={{uri:'https://dictionary.cambridge.org/ja/dictionary/english-japanese/study'}}
                scalesPageToFit={true}
                javaScriptEnabled={true}
              />
          </TouchableOpacity> 
        </View>
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
    flex:1,
    fontSize: 18,
    marginLeft: 5,
  },
  translateVideoCaption: {
    flex: 1,
    // width: '85%',
    height: 200,
    top: '3%',
    // bottom: '40%',
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 5,
    opacity: 0.8,
    borderBottomColor: 'black',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  videoCaptionTranslateView: {
    flex: 1,
    zIndex: 100,
    // width: '100%'
  },
});
export default App;
