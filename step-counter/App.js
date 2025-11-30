import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 🚨 utils 경로 확인 (src/utils/authStorage.js)
import { getItem, setItem, deleteItem } from './src/utils/authStorage';

// 🚨 API 주소 (src/constants.js 에서 가져옴)
import { API_URL } from './src/constants/constants';

// 🚨 화면 파일 경로 (src/screens)
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import RankingScreen from './src/screens/RankingScreen';
import LandmarkScreen from './src/screens/LandmarkScreen';
import LandmarkDetailScreen from './src/screens/LandmarkDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendListScreen from './src/screens/FriendListScreen';     // 👈 친구 목록 화면 추가
import FriendProfileScreen from './src/screens/FriendProfileScreen'; // 👈 친구 상세 프로필 화면 추가

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [sensorStatus, setSensorStatus] = useState('센서 연결 중...');
  const [todayStepCount, setTodayStepCount] = useState(0); 
  
  const stepsToSendRef = useRef(0); 
  const lastUpdateRef = useRef(0); 

  useEffect(() => {
    checkLogin();
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
          console.log("👣 쿵! 발걸음 감지 (+1)");
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
        console.log(`✅ 서버 저장 완료: ${steps}보`);
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
              {/* 1. 홈 화면 (메인) */}
              <Stack.Screen name="Home">
                {(props) => (
                  <HomeScreen 
                    {...props} 
                    stepCount={todayStepCount} 
                    onLogout={handleLogout} 
                  />
                )}
              </Stack.Screen>

              {/* 2. 랭킹 & 랜드마크 */}
              <Stack.Screen name="Ranking" component={RankingScreen} />
              <Stack.Screen name="Landmark" component={LandmarkScreen} />
              <Stack.Screen name="LandmarkDetail" component={LandmarkDetailScreen} />
              
              {/* 3. 내 프로필 & 친구 관련 화면 */}
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="FriendList" component={FriendListScreen} />
              <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
            </>
          ) : (
            <>
              {/* 0. 로그인/회원가입 화면 */}
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