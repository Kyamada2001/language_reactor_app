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
  FlatList,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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


function StudyWord(): JSX.Element {
    const [sample, setSample] = useState<any>()
    const [studyWords, setStudyWords] = useState<any>();

    const setWordStore = async () => {
        const newSaveDatas = {
            enToJp: [{
                text: "English",
                translated: "日本語"
            }]
          }
        const saveDatasString = JSON.stringify(newSaveDatas);
        try {
            await AsyncStorage.setItem(
                'testData',
                saveDatasString
            );
          } catch (error: any) {
            setSample(JSON.stringify(error))
          }
    }

    const getWordStore = async () => {
        try {
            const words: any = await AsyncStorage.getItem('testData');
            setStudyWords(JSON.parse(words));
          } catch (error) {
            setSample(JSON.stringify(error))
          }
    }

    useEffect(() => {
        setWordStore()// サンプルデータ登録
        getWordStore()
    })
    return (
        <View style={styles.container}>
            <Text>単語帳</Text>
            {
                studyWords ? 
                <Text>{JSON.stringify(studyWords.enToJp.text)}</Text>
                : ''
            }
            {
                sample ? 
                <Text>{sample}</Text>
                : ''
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
    },
})

export default StudyWord