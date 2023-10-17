/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Dimensions, TouchableOpacity, StatusBar, SafeAreaView, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Video from './pages/video';
import StudyWord from './pages/sturdyWord';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function App(): JSX.Element {
  return (
    <>
      <NavigationContainer>
        <Tab.Navigator initialRouteName="video">
          <Tab.Screen 
            name="video" 
            component={Video}
            options={{
              tabBarLabel: 'ビデオ選択',
              tabBarIcon: ({ color, size }) => (
                <Icon name='search' size={30}/>
              ),
              unmountOnBlur: true
            }} 
          />
          <Tab.Screen 
            name="studyWord" 
            component={StudyWord}
            options={{
              tabBarLabel: '単語帳',
              tabBarIcon: ({ color, size }) => (
                <Icon name='pencil' size={30}/>
              ),
            }} 
          />
        </Tab.Navigator>
      </NavigationContainer> 
    </>
  )
}
export default App;