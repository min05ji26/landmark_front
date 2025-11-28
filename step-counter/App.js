import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 🚨 [수정 1] 유틸리티 임포트 (로그인 오류 해결)
import { getItem, setItem, deleteItem } from './authStorage';

// 🚨 [수정 2] API 주소 분리
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.219.140:8080'; // 본인 PC IP 확인 필수!

import AuthScreen from './AuthScreen';
import HomeScreen from './HomeScreen';
import RankingScreen from './RankingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 상태 메시지 및 센서 관련
  const [sensorStatus, setSensorStatus] = useState('센서 연결 중...');
  const [todayStepCount, setTodayStepCount] = useState(0); 
  
  const stepsToSendRef = useRef(0); 
  const lastUpdateRef = useRef(0); // 중복 카운트 방지용

  useEffect(() => {
    checkLogin();
    return () => {
      // 앱 꺼질 때 센서 끄기 (웹에서는 무시)
      if (Platform.OS !== 'web') {
        Accelerometer.removeAllListeners();
      }
    };
  }, []);

  const checkLogin = async () => {
    try {
      // 🚨 [수정 3] getItem 사용
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
    // 🚨 [수정 4] setItem 사용
    await setItem('userToken', jwtToken);
    startAccelerometer(); 
  };

  const handleLogout = async () => {
    // 🚨 [수정 5] deleteItem 사용
    await deleteItem('userToken');
    setIsLoggedIn(false);
    stepsToSendRef.current = 0;
    setTodayStepCount(0);
    
    if (Platform.OS !== 'web') {
      Accelerometer.removeAllListeners();
    }
    setSensorStatus('로그아웃 됨');
  };

  // 🔥 가속도 센서 로직 (기존 코드 유지 + 웹 예외 처리)
  const startAccelerometer = () => {
    // 웹에서는 센서 작동 안 함
    if (Platform.OS === 'web') {
      setSensorStatus('🌐 웹 환경 (센서 미지원)');
      return;
    }

    setSensorStatus('🟢 가속도 센서 작동 중');
    
    // 센서 민감도 설정 (보통)
    Accelerometer.setUpdateInterval(100); 

    Accelerometer.addListener(data => {
      const { x, y, z } = data;
      
      // 흔들림 강도 계산
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      
      // 기준치(1.2)보다 세게 흔들리면 걸음으로 간주
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

    // 10초마다 서버 전송
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
      {/* 상태 표시줄 (디자인 유지) */}
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