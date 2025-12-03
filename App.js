import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { getItem, setItem, deleteItem } from './src/utils/authStorage';
import { API_URL } from './src/constants/constants';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import RankingScreen from './src/screens/RankingScreen';
import LandmarkScreen from './src/screens/LandmarkScreen';
import LandmarkDetailScreen from './src/screens/LandmarkDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendListScreen from './src/screens/FriendListScreen';
import FriendProfileScreen from './src/screens/FriendProfileScreen';
import AchievementScreen from './src/screens/AchievementScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [sensorStatus, setSensorStatus] = useState('센서 연결 중...');
  const [todayStepCount, setTodayStepCount] = useState(0); 
  
  const stepsToSendRef = useRef(0); 
  const lastUpdateRef = useRef(0); 

  useEffect(() => {
    // 🚨 [수정] 자동 로그인 기능을 끄기 위해 checkLogin()을 주석 처리했습니다.
    // 다시 자동 로그인을 원하시면 주석을 해제하세요.
    // checkLogin(); 
    
    // 테스트를 위해 앱 시작 시 강제로 로그아웃(토큰 삭제) 하려면 아래 주석을 해제하세요.
    // deleteItem('userToken');

    return () => {
      if (Platform.OS !== 'web') {
        Accelerometer.removeAllListeners();
      }
    };
  }, []);

  const checkLogin = async () => {
    try {
      const savedToken = await getItem('userToken');
      if (savedToken) {
        setIsLoggedIn(true);
        startAccelerometer(); 
      } else {
        setSensorStatus('로그인 필요');
      }
    } catch (e) { console.log(e); }
  };

  const handleLoginSuccess = async (jwtToken) => {
    setIsLoggedIn(true);
    await setItem('userToken', jwtToken);
    startAccelerometer(); 
  };

  const handleLogout = async () => {
    await deleteItem('userToken');
    setIsLoggedIn(false);
    stepsToSendRef.current = 0;
    setTodayStepCount(0);
    
    if (Platform.OS !== 'web') {
      Accelerometer.removeAllListeners();
    }
    setSensorStatus('로그아웃 됨');
  };

  const startAccelerometer = () => {
    if (Platform.OS === 'web') {
      setSensorStatus('🌐 웹 환경 (센서 미지원)');
      return;
    }

    setSensorStatus('🟢 가속도 센서 작동 중');
    Accelerometer.setUpdateInterval(100); 

    Accelerometer.addListener(data => {
      const { x, y, z } = data;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > 1.2) {
        const now = Date.now();
        if (now - lastUpdateRef.current > 350) {
          lastUpdateRef.current = now;
          stepsToSendRef.current += 1;
          setTodayStepCount(prev => prev + 1);
        }
      }
    });

    const syncInterval = setInterval(async () => {
      if (stepsToSendRef.current > 0) {
          await sendStepsToServer(stepsToSendRef.current);
      }
    }, 10000);
  };

  const sendStepsToServer = async (steps) => {
    try {
      const token = await getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/steps/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ steps: steps }),
      });

      if (response.ok) {
        stepsToSendRef.current = 0; 
      }
    } catch (error) {
      console.log('서버 에러:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusHeader}>
         <Text style={{fontSize: 12}}>
            {sensorStatus} | 오늘: {todayStepCount}보 | 대기: {stepsToSendRef.current}
         </Text>
      </View>

      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <>
              <Stack.Screen name="Home">
                {(props) => (
                  <HomeScreen 
                    {...props} 
                    stepCount={todayStepCount} 
                    onLogout={handleLogout} 
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Ranking" component={RankingScreen} />
              <Stack.Screen name="Landmark" component={LandmarkScreen} />
              <Stack.Screen name="LandmarkDetail" component={LandmarkDetailScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="FriendList" component={FriendListScreen} />
              <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
              <Stack.Screen name="Achievement" component={AchievementScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Auth">
                {(props) => (
                  <AuthScreen 
                    {...props} 
                    onLoginSuccess={handleLoginSuccess} 
                  />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  statusHeader: { padding: 8, backgroundColor: '#f0f0f0', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ddd' }
});