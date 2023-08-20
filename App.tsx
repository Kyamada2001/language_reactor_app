/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
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
  const [videoId, setVideoId] = useState(String);

  const [captionIndex, setCaptionIndex] = useState(Number);
  const [captions, setCaptions] = useState(Array<Object>)
  // const [charCaption, setCharCaption] = useState(Array<Array<String>>) この機能の実装はまだ先
  const [currentTime, setCurrentTime] = useState(Number);

  useEffect(() => {
    const fetchYoutubeSubtitles = async () => { 
      const response = await fetch('http://localhost:9000/2015-03-31/functions/function/invocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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
      const captions: any = subtitles.filter(function(subtitle: any) {
        const startTime = parseFloat(subtitle.start);
        const endTime = parseFloat(startTime + subtitle.duration);
        console.log("endTime"+startTime)
        console.log("currentTime" + currentTime)
        console.log("endTime"+endTime)

        return startTime <= currentTime && currentTime < endTime; 
      })
      setCaptions(captions);
    }
  }

  return (
    <SafeAreaView>
      <StatusBar/>
      <View>
        <YoutubePlayer
          ref={playerRef}
          height={youtubeHeight}
          play={true}
          videoId="lhr4Ax4C_-4"
          // onChangeState={}
      />
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
      >
        <View>
          {
            subtitles.length > 0 ?
            subtitles.map((subtitle: any, index: any) => (
              <Text key={index}>{subtitle.text}</Text>
            ))
            : <Text>字幕を表示中です。</Text>
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
