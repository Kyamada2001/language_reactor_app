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
  FlatList
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
import { positional } from 'yargs';


function UnderMenu(): JSX.Element {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Icon name='search' size={40}/>
                <Text style={styles.contentText}>ビデオ選択</Text>    
            </View>
            <View>
                <Icon name='pencil' size={40}/>
                <Text style={styles.contentText}>単語帳</Text>    
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start', // 左揃え
        alignItems: 'center', 
    },
    content: {
        paddingVertical: 5,
    },
    contentText: {
        color: '#64748b'
    }
})

export default UnderMenu