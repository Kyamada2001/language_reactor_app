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
import UnderMenu from './components/underMenu';

const Stack = createNativeStackNavigator();

function App(): JSX.Element {
  return (
    <SafeAreaView>
      <StatusBar/>
      <Video/>
      {/* <NavigationContainer>
        <Stack.Navigator initialRouteName="video">
          <Stack.Screen name="video" component={Video} />
          <Stack.Screen name="studyWord" component={StudyWord} />
        </Stack.Navigator>
      </NavigationContainer> */}
      {/* <UnderMenu/> */}
    </SafeAreaView>
  )
}
export default App;