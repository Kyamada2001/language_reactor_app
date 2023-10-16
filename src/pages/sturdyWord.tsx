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
    return (
        <View style={styles.container}>
            <Text>単語帳</Text>
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