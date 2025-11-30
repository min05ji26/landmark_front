// 파일명: AuthScreen.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

// 🚨 [수정 1] SecureStore 직접 임포트 대신, 위에서 만든 유틸리티를 가져옵니다.
// 경로가 다르다면 본인 프로젝트 구조에 맞춰 수정하세요 (예: './utils/authStorage')
import { setItem } from '../utils/authStorage';
// ✅ 아까 만든 설정 파일에서 API_URL을 가져옵니다.
import { API_URL } from '../constants/constants';

// 🚨 [수정 2] 웹과 앱의 API 주소를 분리합니다.
// 기존 constants 파일이 있다면 거기를 수정해도 되지만, 여기서 처리하는 게 확실합니다.

const AuthScreen = ({ onLoginSuccess }) => {
  // false: 회원가입, true: 로그인
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nickname: '',
    confirmPassword: ''
  });

  const [pwMsg, setPwMsg] = useState('');
  const [isPwMatch, setIsPwMatch] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    if (!isLoginMode && formData.password && formData.confirmPassword) {
      if (formData.password === formData.confirmPassword) {
        setPwMsg('비밀번호가 일치합니다');
        setIsPwMatch(true);
      } else {
        setPwMsg('비밀번호가 일치하지 않습니다');
        setIsPwMatch(false);
      }
    } else {
      setPwMsg('');
      setIsPwMatch(false);
    }
  }, [formData.password, formData.confirmPassword, isLoginMode]);

  const handleSubmit = async () => {
    try {
      if (isLoginMode) {
        // --- [로그인] ---
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        });
        
        const json = await response.json();

        if (json.success) {
          const token = json.data;
          
          // 🚨 [수정 3] 여기서 오류가 발생했었습니다. authStorage의 setItem을 사용합니다.
          await setItem('userToken', token); 
          
          Alert.alert('성공', '로그인 성공! 홈으로 이동합니다.');
          if (onLoginSuccess) onLoginSuccess(token);
        } else {
          Alert.alert('로그인 실패', json.message || '정보를 확인해주세요.');
        }

      } else {
        // --- [회원가입] ---
        if (!isPwMatch) {
          Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
          return;
        }

        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            nickname: formData.nickname
          })
        });

        const json = await response.json();

        if (json.success) {
          Alert.alert('환영합니다', '회원가입 완료! 로그인 해주세요.');
          setIsLoginMode(true);
          setFormData({ ...formData, password: '', confirmPassword: '' });
        } else {
          Alert.alert('가입 실패', json.message || '중복된 정보가 있습니다.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '서버 연결에 실패했습니다.');
    }
  };

  // --- 디자인은 원본 그대로 유지 ---
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{flex:1}}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{isLoginMode ? '로그인' : '회원가입'}</Text>
        </View>

        <View style={styles.formArea}>
          {/* 회원가입 전용 필드 */}
          {!isLoginMode && (
            <>
              <TextInput
                style={styles.input}
                placeholder="닉네임"
                value={formData.nickname}
                onChangeText={(text) => handleChange('nickname', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
              />
            </>
          )}

          {/* 공통 필드 */}
          <TextInput
            style={styles.input}
            placeholder="아이디"
            autoCapitalize="none"
            value={formData.username}
            onChangeText={(text) => handleChange('username', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
          />

          {!isLoginMode && (
            <>
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
              />
              {pwMsg !== '' && (
                <Text style={{ color: isPwMatch ? '#4CAF50' : '#FF5252', marginLeft: 10, fontSize: 12 }}>
                  {pwMsg}
                </Text>
              )}
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>{isLoginMode ? '로그인 하기' : '가입 완료'}</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 탭 */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => setIsLoginMode(true)}
          >
            <Text style={{ color: isLoginMode ? '#333' : '#999', fontWeight: isLoginMode ? 'bold' : 'normal' }}>
              로그인
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => setIsLoginMode(false)}
          >
            <Text style={{ color: !isLoginMode ? '#333' : '#999', fontWeight: !isLoginMode ? 'bold' : 'normal' }}>
              회원가입
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E6F0FF', 
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#333',
  },
  formArea: {
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 16,
    backgroundColor: '#DCE9F9',
    borderRadius: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
    marginBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
});

export default AuthScreen;