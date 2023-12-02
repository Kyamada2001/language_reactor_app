/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Dimensions, TouchableOpacity } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";
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
  FlatList,
  TextInput
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
import Tts from 'react-native-tts';
//TODO: こっちの方がライブラリとして優秀かも
// import { Modalize } from 'react-native-modalize';

//TODO: 処理重い
//　・ScrollViewからFlatListに
// 　・getCurrCaptionの実行頻度を遅くしたり
//  ・英語訳を取得する際、時間ではなくindexで取得したり。
//  ・

const errorCode: number = 1;
const successCode: number = 2;
const CAPTION_HEIGHT = 70;
// TODO: 訳が表示されるまで時間がかかる
interface ChildComponentProps {
  inputFunction: (videoId: string) => void; // プロップスの型を定義
}

function InputUrl({inputFunction}: ChildComponentProps): JSX.Element {
  type Message = {
    code: number, // errorかprimary
    text: string,
  }
  const [url, setUrl] = useState<string>("")
  const [fetchedVideoId, setFetchedVideoId] = useState<string>("")
  const [messages, setMessages] = useState<Array<Message>>([])
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(youtube\.com|youtu\.be)\/(watch\?v=([^&?/]+)|.+\/([^&?/]+))/;
  // TODO:　URLをチェックする処理を追加
  const submitBtn = () => {
    const match: any = url.match(youtubeRegex);
    if (match) {
      const extractedVideoId = match[3] || match[4];
      setFetchedVideoId(extractedVideoId);
      inputFunction(fetchedVideoId)
    } else {
      const newMessage: Message = {
        code: errorCode,
        text: 'URLが正しくありません。'
      }
      
      setMessages([newMessage])
      return false;
    }
  }
  return (
    <View style={styles.inputContainer}>
      <View style={{width: '100%'}}>
        <View style={{marginBottom: 15}}>
          <Text style={styles.labelText}>YoutubeのURLを入力</Text>    
          <TextInput
            style={styles.textInput}
            onChangeText={(text) => setUrl(text)}
            value={url}
          />
        </View>
        <Pressable
          style={[styles.submitBtn]} 
          onPress={() => {submitBtn()}}
        >
          <Text style={[styles.buttonText]}>ビデオ選択</Text>
        </Pressable>
        <View>
          {
            messages.length > 0 ?
            messages.map((message: Message) => {
              return (
                <>
                  <Text style={message.code == errorCode ? styles.errorMessage : styles.primaryMessage}>{message.text}</Text>
                </>
              )
            })
            : ''
          }
        </View>
      </View>
    </View>
  )
}

type videoProps = {
  videoId: string
}

function Video(props: videoProps): JSX.Element {
  type YoutubeCaption = {
    start:string,
    end: string,
    duration: string,
    text: string,
    translate: string
  }
  const playerRef: any = useRef();
  const captionScrollViewRef: any = useRef(null)

  //ステータス関係
  const youtubeHeight = Dimensions.get('window').width / 16 * 9;
  const [videoId, setVideoId] = useState<string | null>(props.videoId); //youtubeのvideoId
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
  const [currCaptionIndex, setCurrCaptionIndex] = useState<number | null>(null); // 字幕全体に対する配列のIndex
  const [currCaptions, setCurrCaptions] = useState(Array<Object>) // 現在再生している字幕情報
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [pressedVideo, setPressedVideo] = useState<boolean>(false)
  const [captionHeight, setCaptionHeight] = useState<number>(0)
  const [nextCaptionTime, setNextCaptionTime] = useState<number | null>(null); //次の字幕の時間
  const [translateIndex, setTranslateIndex] = useState<any>([])

  //モーダル関係内容
  const [sourceText, setSourceText] = useState<string | null>("environment") // ビデオ字幕の翻訳対象文字
  const [sourceTextId, setSourceTextId] = useState(null) // ビデオ字幕の翻訳
  const [videoCaptionInfo, setVideoCaptionInfo] = useState<any>()
  const [sample, setSample] = useState<any>();
  
  
  // TODO: URL系は環境変数で管理する。
  const [googleTranslateUrl, setGoogleTranslateUrl] = useState("https://script.google.com/macros/s/AKfycbyNX-jodYhhZESYMQ9hzDxtzRgs_y4nWgGGFGNB1A8rR_Y9Kn1w1djVZtv1pGKAvA4f/exec")
  // const [charCaption, setCharCaption] = useState(Array<Array<String>>) この機能の実装はまだ先

  useEffect(() => {
    const fetchYoutubecaptions = async () => {
      await fetch('https://uqysdmlg6kbmdjhd437mtmcwbi0obaso.lambda-url.ap-northeast-1.on.aws', {
      // const response = await fetch('https://ra6dyoi3q3.execute-api.ap-northeast-1.amazonaws.com/v1/function', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': 'ru,en;q=0.9',
        },
        body: JSON.stringify({
          videoId: videoId
        }),
      })
      .then(response => response.json())
      .then((responseJson: any) => {
        const data = responseJson//.body;
        setCaptions(JSON.parse(data.caption));
      });
      // setTranslatedCaptions(JSON.parse(data.translate_caption))
    }

    fetchYoutubecaptions();
    Tts.setDefaultLanguage('en-US');
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
    scrollCaptionView(true)
  }, [currCaptionIndex,isCaptionCenter])

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
      if(fetchedCurrCaptions){
        setCurrCaptionIndex(captionIndex!);
        splitCaptionText(fetchedCurrCaptions)
      }
    }
  }

  const hiddenTranslate = () => {
    setSourceText(null)
    setVideoCaptionInfo(null)
    setViewModal(false)
    setVideoStatus('playing')
  }

  const textDictional = (text: string) => {
    const url = `https://jisho.org/api/v1/search/words?keyword="${text}"`

    axios.get(url).then((response: any) => {
      const data = response.data.data
      if(data.length > 0) {
        const dictionary: string = data.filter((item: any, index: number) => index < 3)
        .map((item: any) => item.slug)
        .join(',');
        setVideoCaptionInfo(dictionary)
      }
      else {
        setVideoCaptionInfo('-')
      }
    })
  }



  const pressVideoCaption = async (captionText: any) => {
    hiddenTranslate();
    setSourceText(captionText)
    // text指定する際、caption.textと指定する必要がある。
    textDictional(captionText)
    setViewModal(true)
    // 全ての処理が終わってからモーダル表示する
    setTimeout(() => {
      speachText(captionText)
    }, 500);
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

  const scrollCaptionView = (animated: boolean) => {
    if(isCaptionCenter && currCaptionIndex){
    // 真ん中に来るように調整
    const ajustNumber = 2;
    const scrollIndex = currCaptionIndex - ajustNumber;
    captionScrollViewRef?.current?.scrollToIndex({
      index: scrollIndex >= 0 ? scrollIndex : currCaptionIndex,
      viewPosition: 0,
      animated: animated,
    })
  }else {
    return ;
  }
  }

  const speachText = (text: string) => {
    Tts.speak(text);
  }

  const VideoCaptionModal = () => {
    if(!viewModal || !videoCaptionInfo) return;
    return (
      <Modal isVisible={viewModal}>
          <View style={styles.padding10}>
            <TouchableOpacity onPress={hiddenTranslate} style={styles.modalCloseBtn}>
              <Icon name='close' size={20}/>
            </TouchableOpacity>
            <View style={styles.overlayHead}>
              <View style={styles.overlayHeader}>
                <Text style={styles.originalWord}>{sourceText}</Text>
                <TouchableOpacity style={styles.playbackIcon} onPress={() => speachText(sourceText!)}>
                    <Icon name='volume-up' size={20}/>
                </TouchableOpacity>
              </View>
              <View>
                <Text style={styles.dictionaryInfo}>
                  {videoCaptionInfo}
                </Text>
              </View>
            </View>
            <View style={styles.overlayBody}>
              <Text style={styles.translateLabel}>現在の字幕</Text>
              <Text style={{ color: '#bfdbfe', fontWeight: 'bold',}}>訳：{captions[currCaptionIndex!].translate ? captions[currCaptionIndex!].translate : ''}</Text>
              <Text style={{ color: 'white', fontWeight: 'bold',}}>{captions[currCaptionIndex!].text ? captions[currCaptionIndex!].text : ''}</Text>
            </View>
            <View>
              <Text>{JSON.stringify(captionTexts ?? '')}</Text>
            </View>
          </View>
        </Modal>
    )
  }

  return (
    <>
      {/* 字幕をクリックした際、(pressVideoCaption発火時)、WebViewで翻訳を表示する */}
      <VideoCaptionModal/>
      <View>
        <Pressable onPress={pressVideoFrame}>
          <YoutubePlayer
            ref={playerRef}
            height={youtubeHeight}
            play={isVideoPlaying}
            videoId={videoId!}
            onChangeState={(e: any) => setVideoStatus(e)}
            initialPlayerParams={{
              preventFullScreen: true,
              controls: true,
              iv_load_policy: 3,
              modestbranding: true
            }}
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
                      <TouchableOpacity style={{display: 'flex'}} onPress={() => pressVideoCaption(text)}>
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
      <View>
        <View>
          <TouchableWithoutFeedback onPressIn={()=> setIsCaptionCenter(false)}>
            {
              captions.length > 0 ?
              <FlatList
                ref={captionScrollViewRef}
                data={captions}
                keyExtractor={(item) => item.id}
                getItemLayout={(data, index) => (
                  {length: CAPTION_HEIGHT, offset: CAPTION_HEIGHT * index, index}
                )}
                renderItem={({item,index}) => {
                  return (
                    <View 
                      style={styles.captions}
                    >
                      <TouchableOpacity style={styles.playbackIcon} onPress={() => youtubePlayback(parseFloat(item.start))}>
                        <Icon 
                          name='volume-up'
                          size={20}
                          color={currCaptionIndex === index ? '#3b82f6' : '#0a0a0a'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        if(translateIndex.includes(index)) setTranslateIndex((prev: any) => [...prev.filter((item: any) => item != index)])
                        else setTranslateIndex((prev: any) => [...prev, index])
                      }}>
                        {
                          translateIndex.includes(index) ?
                            <Text style={{fontSize: 13, marginRight: 5, marginLeft: 5, color: '#3b82f6'}}>訳：{item.translate ? item.translate : '-'}</Text>
                          : ''
                        }
                        <Text style={styles.captionText} key={index}>{item.text}</Text>
                      </TouchableOpacity>
                    </View>
                  )
                }}
              ></FlatList>
              : <Text>字幕を表示中です。</Text>
            }
          </TouchableWithoutFeedback>
        </View>
        {
          !isCaptionCenter ?
          <View  style={styles.captionCenterButton}>
            <TouchableWithoutFeedback
            onPress={() => {
              setIsCaptionCenter(true)
            }}
            >
              <Icon name='unsorted' size={30} color={'#3b82f6'}/>
            </TouchableWithoutFeedback>
          </View>
          : ''
        }
      </View>
    </>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: 'black',
    paddingLeft: 10,
    paddingRight: 10,
  },
  captions: {
    // flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start', // 左揃え
    alignItems: 'center', 
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderBottomColor: 'black',
    height: CAPTION_HEIGHT,
  },
  playbackIcon: {
    display: 'flex',
    padding: 4
  },
  captionText: {
    zIndex: 10,
    // fontSize: 18,
    // paddingVertical: 20
    marginLeft: 5,
    marginRight: 5,
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
    padding: 10
  },
  overlayHeader: {
    alignItems: 'center', 
    flexDirection: 'row'
  },
  overlayBody: {
    width: '100%',
    padding: 10,
    backgroundColor: 'rebeccapurple'
  },
  originalWord: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'gold',
  },
  translateLabel: {
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
  modalCloseBtn: {
    position: 'absolute', // 絶対位置指定
    top: 15, // 上からの距離
    right: 15, // 右からの距離
    borderRadius: 25, // 角丸
    zIndex: 150,
  },
  captionCenterButton: {
    position: 'absolute', // 絶対位置指定
    top: 10, // 上からの距離
    right: 10, // 右からの距離
    borderRadius: 25, // 角丸
  },
  zIndex100: {
    zIndex: 100,
  },
  padding10: {
    padding: 10
  },
  //inputUrlのStyle
  textInput: {
    height: 40,
    borderColor: '#6b7280',
    borderWidth: 1,
    width: '100%'
  },
  labelText: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 5,
  },
  submitBtn: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    height: '100%',
    flex: 1,
    alignItems: 'center',
    margin: 15,
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 5,
    margin: 10,
  },
  primaryMessage: {
    color: '#22c55e',
    fontSize: 13,
    marginBottom: 5,
    margin: 10,
  }
});

const App = () =>{
  const [videoId, setVideoId] = useState<string>(""); //youtubeのvideoId
  const inputUrl = (fetchedVideoId: any) => {
    setVideoId(fetchedVideoId)
  }
  return (
    <>
      {
        videoId ? <Video videoId={videoId}/> : <InputUrl inputFunction={inputUrl}/>
      }
    </>
  )
}

export default App