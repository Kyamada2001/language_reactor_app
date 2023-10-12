/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState, useEffect, useRef, useMemo } from 'react';
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
  const captionScrollViewRef: any = useRef(null)

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
  const [videoStatus, setVideoStatus] = useState<string>("") // ビデオ開始停止
  const [viewModal, setViewModal] = useState(false) //モーダル開閉
  const [isCaptionCenter, setIsCaptionCenter] = useState<boolean>(true)
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true)
  const captionViewBeforeSec = 1; // 字幕を取得する処理を考慮し、事前に処理開始秒数を早める時間。端末のスペックも影響あるので、調整必要

  //字幕関係
  const [captions, setCaptions] = useState<any>([]);
  const [captionTexts, setCaptionTexts] = useState<any>()
  const [translatedCaptions, setTranslatedCaptions] = useState([])
  const [currCaptionIndex, setCurrCaptionIndex] = useState<number | null>(null); // 字幕全体に対する配列のIndex
  const [currCaptions, setCurrCaptions] = useState(Array<Object>) // 現在再生している字幕情報
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [pressedVideo, setPressedVideo] = useState<boolean>(false)
  const [captionHeight, setCaptionHeight] = useState<number>(0)
  const [nextCaptionTime, setNextCaptionTime] = useState<number | null>(null); //次の字幕の時間

  //モーダル関係内容
  const [translatedCaption, setTranslatedCaption] = useState<any>();
  const [sourceText, setSourceText] = useState<string | null>("environment") // ビデオ字幕の翻訳対象文字
  const [sourceTextId, setSourceTextId] = useState(null) // ビデオ字幕の翻訳
  const [videoCaptionInfo, setVideoCaptionInfo] = useState<any>()
  const [sample, setSample] = useState<any>();
  
  
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
      if (newTime != currentTime) {
          setCurrentTime(newTime);
      }
    }, 100); // 0.1秒ごとに監視
  }, []); // 依存配列を空にする

  useEffect(() => {
    // モーダルが開かれていない場合、字幕が表示されていない場合、次の字幕時間になった場合に字幕を取得
    if(isVideoPlaying && !viewModal) {
      getCurrCaption();
    }
  }, [currentTime])

  // TODo:ここ修正する必要ないかも。一旦修正見送りで
  useEffect(() => {
    if(videoStatus == 'playing' 
    || videoStatus == 'buffering' 
    || videoStatus == 'unstarted'
    || (videoStatus == 'paused' && !viewModal)) {
      setIsVideoPlaying(true)
    } else {
      setIsVideoPlaying(false)
    }
  }, [videoStatus])

  useEffect(() => { // 動くか検証必要
    if(isCaptionCenter){
      scrollCaptionView()
    }else {
      return;
    }
  }, [currCaptionIndex])

  function splitCaptionText(subtitle: YoutubeCaption) {
    const splitTexts = subtitle.text.split(" ");
    setCaptionTexts(splitTexts)
  }
  function getCurrCaption() {
    if(captions.length > 0) {
      let fetchedCurrCaptions: any;
      let captionIndex: number;
      let currNextTime: number | null = null;
      captions.map(function(caption: YoutubeCaption, index: any){
        const startTime = parseFloat(caption.start);
        const endTime = parseFloat(startTime + caption.duration);

        // currCaptionIndexの次の場合、次の時間をセットする。
        if(index == captionIndex + 1) {
          currNextTime = parseFloat(caption.start) - captionViewBeforeSec
        }

        // 時間が一致した場合、stateにセットする。
        if((startTime - captionViewBeforeSec) <= currentTime! && currentTime! < endTime) {
          fetchedCurrCaptions = caption;
          captionIndex = index;
        }
      })
      setCurrCaptions(fetchedCurrCaptions);
      setNextCaptionTime(currNextTime);
      setCurrCaptionIndex(captionIndex!);
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

  const getCurrTranslateCaption = () => {
    const sourceCaption: any = currCaptions;
    const startTime = sourceCaption.start;
    const duration = sourceCaption.duration;

    const translated: any = translatedCaptions.filter(function(element: any) {
      return startTime == element.start && duration == element.duration
    })
    setTranslatedCaption(translated[0]);
  }

  const pressVideoCaption = async (captionText: any) => {
      hiddenTranslate();
    // text指定する際、caption.textと指定する必要がある。
    new Promise(async function(resolve, reject){
      setVideoStatus("paused") // これが原因。これなければ、useEffectで修正する必要なし
      setSourceText(captionText)
      // setSourceTextId(captionId)
      await textDictional(captionText) //.then((dictionaryText) => setVideoCaptionInfo(dictionaryText))
      getCurrTranslateCaption() // 表示されている字幕のIndexを渡し、字幕をセットする
      // setViewModal(true)
      resolve(null)
    }).then(() => {
      // 全ての処理が終わってからモーダル表示する
      setViewModal(true)
    }).catch((err) => {
      setTranslatedCaption(err)
      setViewModal(true)
    })
  }

  // Youtube動画下の字幕を押下した際のイベント
  const youtubePlayback = (time: number) => {
    playerRef.current?.seekTo(time)
    // TODO: 処理が重くなるので、クリックしたものをそのままSEtできないか検討
    // TODO: 翻訳を取得したりする際、かなり遅くなるので検討
    setCurrentTime(time);
  } 


  function pressVideoFrame() {
    setPressedVideo(true)
    setTimeout(() => {
      setPressedVideo(false)
    }, 4000);
  }

  const scrollCaptionView = () => {
    // 真ん中に来るように調整
    const ajustNumber = 3;
    const captionNumber: number = currCaptionIndex! - ajustNumber;
    const x = 0
    const y = captionHeight * captionNumber - captionHeight / 2;
    captionScrollViewRef?.current?.scrollTo({x,y,Animatable: true})
  }
  

  const VideoCaptionInfo = () => {
    if(!viewModal) return;
    const newlineStrings = videoCaptionInfo.split('/', 3);
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
            play={isVideoPlaying}
            videoId={videoId}
            onChangeState={(e: any) => setVideoStatus(e)}
            // onChangeState={}
          />
        </Pressable>
        <View style={[styles.overlay, pressedVideo || videoStatus == 'paused' ? styles.overlayPress : styles.overlayNotPress]}>
          {
            currCaptions ?
              <>
              <View style={styles.captionContainer}>
                {
                  captionTexts ? 
                  captionTexts.map((text: any, index: any) => {
                    return (
                      <TouchableOpacity onPress={() => pressVideoCaption(text)}>
                        <Text style={styles.overlayText} key={index}>{text}</Text>
                      </TouchableOpacity>
                    )
                  })
                : ''
                }
              </View>
              </>
            : null
          }
        </View>
      </View>
      <TouchableWithoutFeedback onPress={()=> setIsCaptionCenter(false)}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        ref={captionScrollViewRef}
      >
        <View>
          {
            captions.length > 0 ?
            captions.map((subtitle: any, index: any) => (
              <View 
                style={styles.captions}
                onLayout={(element) => {
                  if(index == 0) setCaptionHeight(element.nativeEvent.layout.height)
                }}
              >
                <TouchableOpacity style={styles.playbackIcon} onPress={() => youtubePlayback(parseFloat(subtitle.start))}>
                  <Icon 
                    name='volume-up'
                    size={20}
                    color={currCaptionIndex === index ? '#3b82f6' : '#0a0a0a'}
                  />
                </TouchableOpacity>
                <Text style={styles.captionText} key={index}>{subtitle.text}</Text>
              </View>
            ))
            : <Text>字幕を表示中です。</Text>
          }
        </View>
      </ScrollView>
      </TouchableWithoutFeedback>
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
    paddingVertical: 10,
    borderWidth: 1,
    borderBottomColor: 'black',
  },
  playbackIcon: {
    display: 'flex',
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
export default App