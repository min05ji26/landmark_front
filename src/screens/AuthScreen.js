import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, 
  ScrollView, KeyboardAvoidingView, Platform, Image, Dimensions, Modal 
} from 'react-native';

import { setItem } from '../utils/authStorage';
import { API_URL } from '../constants/constants';

const { width, height } = Dimensions.get('window');

const AuthScreen = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'findId', 'findPw', 'resetPw'

  // --- 로그인 상태 ---
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // --- 회원가입 상태 ---
  const [regData, setRegData] = useState({
    username: '', password: '', confirmPassword: '', nickname: '', email: ''
  });
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [nicknameStatus, setNicknameStatus] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [pwMatchStatus, setPwMatchStatus] = useState(null);

  // --- 아이디 찾기(이메일 인증) 상태 ---
  const [findIdData, setFindIdData] = useState({ nickname: '', email: '', code: '' });
  const [isCodeSent, setIsCodeSent] = useState(false);        
  const [verifyError, setVerifyError] = useState('');         
  const [findIdResult, setFindIdResult] = useState({ visible: false, username: '' });
  const [statusMessage, setStatusMessage] = useState(''); 
  const [isStatusError, setIsStatusError] = useState(false); 

  // --- 비밀번호 찾기 & 재설정 상태 ---
  const [findPwData, setFindPwData] = useState({ username: '', email: '' });
  const [findPwErrors, setFindPwErrors] = useState({ username: '', email: '' }); 
  const [resetPwData, setResetPwData] = useState({ newPassword: '', confirmNewPassword: '' });
  const [resetPwMatch, setResetPwMatch] = useState(null);
  const [resetPwError, setResetPwError] = useState(''); 
  // ✅ [추가] 비밀번호 재설정 성공 팝업 상태
  const [resetSuccessVisible, setResetSuccessVisible] = useState(false);

  // 비밀번호 일치 확인 (회원가입용)
  useEffect(() => {
    if (authMode === 'register') {
      if (regData.password && regData.confirmPassword) {
        if (regData.password === regData.confirmPassword) {
          setPwMatchStatus({ match: true, msg: "비밀번호가 일치합니다." });
        } else {
          setPwMatchStatus({ match: false, msg: "비밀번호가 일치하지 않습니다." });
        }
      } else {
        setPwMatchStatus(null);
      }
    }
  }, [regData.password, regData.confirmPassword, authMode]);

  // 비밀번호 일치 확인 (재설정용)
  useEffect(() => {
    if (authMode === 'resetPw') {
      if (resetPwData.newPassword && resetPwData.confirmNewPassword) {
        if (resetPwData.newPassword === resetPwData.confirmNewPassword) {
          setResetPwMatch({ match: true, msg: "비밀번호가 일치합니다." });
        } else {
          setResetPwMatch({ match: false, msg: "비밀번호가 일치하지 않습니다." });
        }
      } else {
        setResetPwMatch(null);
      }
    }
  }, [resetPwData.newPassword, resetPwData.confirmNewPassword, authMode]);

  // --- 핸들러 ---
  const handleLoginChange = (name, value) => setLoginData({ ...loginData, [name]: value });
  
  const handleRegChange = (name, value) => {
    setRegData({ ...regData, [name]: value });
    if (name === 'username') setUsernameStatus(null);
    if (name === 'nickname') setNicknameStatus(null);
    if (name === 'email') setEmailStatus(null);
  };

  const handleFindIdChange = (name, value) => {
    setFindIdData({ ...findIdData, [name]: value });
    if (name === 'code' || name === 'email') {
        setStatusMessage(''); 
        setIsStatusError(false);
    }
    if (name === 'code') setVerifyError('');
  };

  const handleFindPwChange = (name, value) => {
    setFindPwData({ ...findPwData, [name]: value });
    setFindPwErrors({ ...findPwErrors, [name]: '' });
  };

  const handleResetPwChange = (name, value) => {
    setResetPwData({ ...resetPwData, [name]: value });
    setResetPwError('');
  };

  // --- [API] 중복 확인 ---
  const checkDuplicate = async (type, value) => {
    if (!value.trim()) { Alert.alert("알림", "내용을 입력해주세요."); return; }
    
    const encodedValue = encodeURIComponent(value);
    let endpoint = "";
    if (type === 'username') endpoint = `/api/auth/check-username?username=${encodedValue}`;
    else if (type === 'nickname') endpoint = `/api/auth/check-nickname?nickname=${encodedValue}`;
    else if (type === 'email') endpoint = `/api/auth/check-email?email=${encodedValue}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      const json = await response.json();
      const isAvailable = json.data; 
      const message = json.message; 

      if (type === 'username') setUsernameStatus({ available: isAvailable, msg: message });
      else if (type === 'nickname') setNicknameStatus({ available: isAvailable, msg: message });
      else if (type === 'email') setEmailStatus({ available: isAvailable, msg: message });
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "서버 통신 실패");
    }
  };

  // --- [API] 로그인 ---
  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const json = await response.json();
      if (json.success) {
        await setItem('userToken', json.data);
        if (onLoginSuccess) onLoginSuccess(json.data);
      } else {
        Alert.alert('로그인 실패', json.message || '정보를 확인해주세요.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    }
  };

  // --- [API] 회원가입 ---
  const handleRegister = async () => {
    if (!usernameStatus?.available) { Alert.alert("알림", "아이디 중복확인을 해주세요."); return; }
    if (!pwMatchStatus?.match) { Alert.alert("알림", "비밀번호가 일치하지 않습니다."); return; }
    if (!nicknameStatus?.available) { Alert.alert("알림", "닉네임 중복확인을 해주세요."); return; }
    if (!emailStatus?.available) { Alert.alert("알림", "이메일 중복확인을 해주세요."); return; }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert('환영합니다', '회원가입 완료! 로그인 해주세요.');
        setAuthMode('login');
        setRegData({ username:'', password:'', confirmPassword:'', nickname:'', email:'' });
      } else {
        Alert.alert('가입 실패', json.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    }
  };

  // --- [API] 아이디 찾기 1단계: 전송 ---
  const handleSendCode = async () => {
    if (!findIdData.nickname || !findIdData.email) {
      Alert.alert("알림", "닉네임과 이메일을 모두 입력해주세요.");
      return;
    }
    
    setStatusMessage("전송 중...");
    setIsStatusError(false);

    try {
        const nicknameEncoded = encodeURIComponent(findIdData.nickname);
        const emailEncoded = encodeURIComponent(findIdData.email);

        const response = await fetch(`${API_URL}/api/email-auth/send?nickname=${nicknameEncoded}&email=${emailEncoded}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                setStatusMessage(errorJson.message || "일치하는 정보가 없습니다.");
                setIsStatusError(true);
            } catch {
                Alert.alert("오류", `서버 오류 발생 (${response.status})`);
                setStatusMessage("");
            }
            return;
        }

        const json = await response.json();
        if (json.success) {
            setStatusMessage("인증번호를 전송하였습니다.");
            setIsStatusError(false);
            setIsCodeSent(true);
            setVerifyError('');
        } else {
            setStatusMessage(json.message || "정보가 일치하지 않습니다.");
            setIsStatusError(true);
        }
    } catch (e) {
        console.error(e);
        setStatusMessage("서버 통신 실패");
        setIsStatusError(true);
    }
  };

  // --- [API] 아이디 찾기 2단계: 검증 ---
  const handleVerifyCode = async () => {
    if (!findIdData.code) {
        Alert.alert("알림", "인증번호를 입력해주세요.");
        return;
    }

    try {
        const emailEncoded = encodeURIComponent(findIdData.email);
        const codeEncoded = encodeURIComponent(findIdData.code);

        const response = await fetch(`${API_URL}/api/email-auth/verify?email=${emailEncoded}&code=${codeEncoded}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
             const errorText = await response.text();
             try {
                 const errorJson = JSON.parse(errorText);
                 setVerifyError(errorJson.message || "인증 실패");
             } catch {
                 setVerifyError("서버 통신 오류가 발생했습니다.");
             }
             return;
        }

        const json = await response.json();
        if (json.success) {
            setFindIdResult({ visible: true, username: json.data });
            setVerifyError('');
        } else {
            setVerifyError("인증번호가 일치하지 않습니다.");
        }
    } catch (e) {
        console.error(e);
        Alert.alert("오류", "서버 통신 실패");
    }
  };

  // --- [API] 비밀번호 찾기 (정보 확인) ---
  const handleCheckResetInfo = async () => {
    if (!findPwData.username || !findPwData.email) {
        Alert.alert("알림", "아이디와 이메일을 입력해주세요.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/check-reset-info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(findPwData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                const message = errorJson.message || "";
                
                if (message.includes("아이디")) {
                    setFindPwErrors({ username: "존재하지 않는 아이디입니다.", email: "" });
                } else if (message.includes("이메일")) {
                    setFindPwErrors({ username: "", email: "존재하지 않는 이메일입니다." });
                } else {
                    Alert.alert("실패", message);
                }
            } catch {
                Alert.alert("오류", "서버 오류가 발생했습니다.");
            }
            return;
        }

        setAuthMode('resetPw');
        
    } catch (e) {
        console.error(e);
        Alert.alert("오류", "서버 통신 실패");
    }
  };

  // --- [API] 비밀번호 재설정 ---
  const handleResetPassword = async () => {
    if (!resetPwData.newPassword || !resetPwData.confirmNewPassword) {
        Alert.alert("알림", "비밀번호를 입력해주세요.");
        return;
    }
    if (!resetPwMatch?.match) {
        Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: findPwData.username,
                newPassword: resetPwData.newPassword
            })
        });

        const json = await response.json();
        
        if (!response.ok) {
            // 409 Conflict: 비밀번호가 이전과 일치할 때 등
            setResetPwError(json.message || "비밀번호 재설정 실패");
            return;
        }

        if (json.success) {
            // ✅ [수정] Alert 대신 성공 팝업 띄우기
            setResetSuccessVisible(true);
        } else {
            setResetPwError(json.message);
        }
    } catch (e) {
        console.error(e);
        Alert.alert("오류", "서버 통신 실패");
    }
  };

  // --- 화면 렌더링 ---

  const renderLogin = () => (
    <View style={styles.contentContainer}>
      <View style={styles.imageArea}>
        <Image 
          source={ require('../../assets/images/AuthScreenIcon.png') } 
          style={styles.mainImage} resizeMode="contain"
        />
      </View>
      <View style={styles.formArea}>
        <TextInput
          style={styles.input} placeholder="아이디" placeholderTextColor="#aaa" autoCapitalize="none"
          value={loginData.username} onChangeText={(text) => handleLoginChange('username', text)}
        />
        <TextInput
          style={styles.input} placeholder="비밀번호" placeholderTextColor="#aaa" secureTextEntry
          value={loginData.password} onChangeText={(text) => handleLoginChange('password', text)}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>로그인</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => setAuthMode('findId')}>
          <Text style={styles.linkText}>아이디 찾기</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity onPress={() => setAuthMode('findPw')}>
          <Text style={styles.linkText}>비밀번호 찾기</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity onPress={() => setAuthMode('register')}>
          <Text style={styles.linkTextBold}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRegister = () => (
    <View style={styles.contentContainer}>
      <View style={styles.regHeader}>
        <TouchableOpacity onPress={() => setAuthMode('login')} style={styles.backButton}>
          <Text style={{fontSize:24, color:'#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.imageAreaSmall}>
        <Image 
          source={require('../../assets/images/RegisterIcon.png')} 
          style={styles.mainImage} resizeMode="contain"
        />
      </View>
      <View style={styles.formArea}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputWithBtn} placeholder="아이디" autoCapitalize="none"
            value={regData.username} onChangeText={(text) => handleRegChange('username', text)}
          />
          <TouchableOpacity style={styles.checkBtn} onPress={() => checkDuplicate('username', regData.username)}>
            <Text style={styles.checkBtnText}>중복확인</Text>
          </TouchableOpacity>
        </View>
        {usernameStatus && <Text style={[styles.statusText, { color: usernameStatus.available ? '#4CAF50' : '#FF5252' }]}>{usernameStatus.msg}</Text>}
        
        <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry value={regData.password} onChangeText={(text) => handleRegChange('password', text)} />
        <TextInput style={styles.input} placeholder="비밀번호 확인" secureTextEntry value={regData.confirmPassword} onChangeText={(text) => handleRegChange('confirmPassword', text)} />
        {pwMatchStatus && <Text style={[styles.statusText, { color: pwMatchStatus.match ? '#4CAF50' : '#FF5252' }]}>{pwMatchStatus.msg}</Text>}
        
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputWithBtn} placeholder="닉네임"
            value={regData.nickname} onChangeText={(text) => handleRegChange('nickname', text)}
          />
          <TouchableOpacity style={styles.checkBtn} onPress={() => checkDuplicate('nickname', regData.nickname)}>
            <Text style={styles.checkBtnText}>중복확인</Text>
          </TouchableOpacity>
        </View>
        {nicknameStatus && <Text style={[styles.statusText, { color: nicknameStatus.available ? '#4CAF50' : '#FF5252' }]}>{nicknameStatus.msg}</Text>}
        
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputWithBtn} placeholder="이메일" keyboardType="email-address"
            value={regData.email} onChangeText={(text) => handleRegChange('email', text)}
          />
          <TouchableOpacity style={styles.checkBtn} onPress={() => checkDuplicate('email', regData.email)}>
            <Text style={styles.checkBtnText}>중복확인</Text>
          </TouchableOpacity>
        </View>
        {emailStatus && <Text style={[styles.statusText, { color: emailStatus.available ? '#4CAF50' : '#FF5252' }]}>{emailStatus.msg}</Text>}
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
          <Text style={styles.primaryButtonText}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFindId = () => (
    <View style={styles.contentContainer}>
      <View style={styles.regHeader}>
        <TouchableOpacity 
          onPress={() => { setAuthMode('login'); setIsCodeSent(false); setFindIdData({nickname:'', email:'', code:''}); setStatusMessage(''); }} 
          style={styles.backButton}
        >
          <Text style={{fontSize:24, color:'#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageArea}>
        <Image 
          source={require('../../assets/images/SearchUserIcon.png')} 
          style={styles.mainImage} resizeMode="contain"
        />
      </View>

      <View style={styles.formArea}>
        <Text style={styles.pageTitle}>아이디 찾기</Text>
        
        <TextInput
          style={styles.input} placeholder="닉네임을 입력해주세요"
          value={findIdData.nickname} onChangeText={(text) => handleFindIdChange('nickname', text)}
          editable={!isCodeSent}
        />

        <View style={styles.inputWrapper}>
            <TextInput
                style={styles.inputWithBtn} placeholder="이메일을 입력해주세요" keyboardType="email-address"
                value={findIdData.email} onChangeText={(text) => handleFindIdChange('email', text)}
                editable={!isCodeSent}
            />
            <TouchableOpacity 
                style={[styles.checkBtn, isCodeSent && {backgroundColor:'#ddd', borderColor:'#ddd'}]} 
                onPress={handleSendCode}
                disabled={isCodeSent}
            >
                <Text style={[styles.checkBtnText, isCodeSent && {color:'#888'}]}>
                    {isCodeSent ? "전송됨" : "인증요청"}
                </Text>
            </TouchableOpacity>
        </View>

        {isCodeSent && (
            <View style={{width: '100%', marginTop: 5}}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.inputWithBtn} placeholder="인증번호 6자리" keyboardType="number-pad"
                        value={findIdData.code} onChangeText={(text) => handleFindIdChange('code', text)}
                    />
                    <TouchableOpacity style={styles.checkBtn} onPress={handleVerifyCode}>
                        <Text style={styles.checkBtnText}>확인</Text>
                    </TouchableOpacity>
                </View>
                {verifyError !== '' && <Text style={styles.errorText}>{verifyError}</Text>}
            </View>
        )}
        
        {statusMessage !== '' && (
            <Text style={[styles.statusText, { 
                color: isStatusError ? '#FF5252' : '#4CAF50', 
                textAlign: 'center', fontWeight: 'bold' 
            }]}>
                {statusMessage}
            </Text>
        )}
        
        {isCodeSent && (
            <TouchableOpacity onPress={() => { setIsCodeSent(false); setFindIdData({...findIdData, code:''}); setStatusMessage(''); }} style={{alignItems:'center', marginTop:10}}>
                <Text style={{color:'#888', textDecorationLine:'underline', fontSize:12}}>이메일 다시 입력하기</Text>
            </TouchableOpacity>
        )}
      </View>

      <Modal
        animationType="fade" transparent={true} visible={findIdResult.visible}
        onRequestClose={() => setFindIdResult({...findIdResult, visible:false})}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{findIdData.nickname}님의 아이디는</Text>
            <Text style={styles.modalIdText}>'{findIdResult.username}'</Text>
            <Text style={styles.modalText}>입니다.</Text>
            <TouchableOpacity 
              style={[styles.primaryButton, {marginTop: 20, width: '100%'}]} 
              onPress={() => {
                setFindIdResult({ visible: false, username: '' });
                setAuthMode('login');
              }}
            >
              <Text style={styles.primaryButtonText}>로그인 하러가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  // 4. 비밀번호 찾기
  const renderFindPw = () => (
    <View style={styles.contentContainer}>
      <View style={styles.regHeader}>
        <TouchableOpacity 
          onPress={() => { setAuthMode('login'); setFindPwData({username:'', email:''}); setFindPwErrors({username:'', email:''}); }} 
          style={styles.backButton}
        >
          <Text style={{fontSize:24, color:'#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageArea}>
        <Image 
          source={require('../../assets/images/SearchUserIcon.png')} 
          style={styles.mainImage} resizeMode="contain"
        />
      </View>

      <View style={styles.formArea}>
        <Text style={styles.pageTitle}>비밀번호 찾기</Text>
        
        <TextInput
          style={styles.input} placeholder="아이디를 입력해주세요"
          value={findPwData.username} onChangeText={(text) => handleFindPwChange('username', text)}
        />
        {findPwErrors.username !== '' && <Text style={styles.errorText}>{findPwErrors.username}</Text>}

        <TextInput
          style={styles.input} placeholder="이메일을 입력해주세요" keyboardType="email-address"
          value={findPwData.email} onChangeText={(text) => handleFindPwChange('email', text)}
        />
        {findPwErrors.email !== '' && <Text style={styles.errorText}>{findPwErrors.email}</Text>}

        <TouchableOpacity style={styles.primaryButton} onPress={handleCheckResetInfo}>
          <Text style={styles.primaryButtonText}>비밀번호 찾기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 5. 비밀번호 재설정
  const renderResetPw = () => (
    <View style={styles.contentContainer}>
      <View style={styles.regHeader}>
        <TouchableOpacity 
          onPress={() => setAuthMode('findPw')} 
          style={styles.backButton}
        >
          <Text style={{fontSize:24, color:'#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageArea}>
        <Image 
          source={require('../../assets/images/SearchUserIcon.png')} 
          style={styles.mainImage} resizeMode="contain"
        />
      </View>

      <View style={styles.formArea}>
        <Text style={styles.pageTitle}>비밀번호 재설정</Text>
        
        <TextInput
          style={styles.input} placeholder="새로운 비밀번호" secureTextEntry
          value={resetPwData.newPassword} onChangeText={(text) => handleResetPwChange('newPassword', text)}
        />
        
        <TextInput
          style={styles.input} placeholder="새로운 비밀번호 확인" secureTextEntry
          value={resetPwData.confirmNewPassword} onChangeText={(text) => handleResetPwChange('confirmNewPassword', text)}
        />
        {resetPwMatch && (
          <Text style={[styles.statusText, { color: resetPwMatch.match ? '#4CAF50' : '#FF5252' }]}>
            {resetPwMatch.msg}
          </Text>
        )}
        {resetPwError !== '' && <Text style={styles.errorText}>{resetPwError}</Text>}

        <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword}>
          <Text style={styles.primaryButtonText}>비밀번호 재설정</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ [추가] 비밀번호 재설정 성공 팝업 */}
      <Modal
        animationType="fade" transparent={true} visible={resetSuccessVisible}
        onRequestClose={() => setResetSuccessVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>비밀번호가 재설정 되었습니다!</Text>
            <Text style={styles.modalText}>다시 로그인 해주세요!</Text>
            <TouchableOpacity 
              style={[styles.primaryButton, {marginTop: 20, width: '100%'}]} 
              onPress={() => {
                setResetSuccessVisible(false);
                setAuthMode('login');
                // 폼 초기화
                setFindPwData({ username: '', email: '' });
                setResetPwData({ newPassword: '', confirmNewPassword: '' });
                setResetPwError('');
              }}
            >
              <Text style={styles.primaryButtonText}>로그인 하러가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1, backgroundColor: '#F8F9FA'}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        {authMode === 'login' && renderLogin()}
        {authMode === 'register' && renderRegister()}
        {authMode === 'findId' && renderFindId()}
        {authMode === 'findPw' && renderFindPw()}
        {authMode === 'resetPw' && renderResetPw()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  contentContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', paddingBottom: 40 },
  regHeader: { width: '100%', alignItems: 'flex-start', marginTop: 40, marginBottom: 10 },
  backButton: { padding: 10 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign:'center', marginBottom: 20 },
  imageArea: { height: height * 0.35, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  imageAreaSmall: { height: height * 0.25, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  mainImage: { width: '80%', height: '100%' },
  formArea: { width: '100%' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, fontSize: 14, color: '#333', marginBottom: 10, borderWidth: 1, borderColor: '#EFEFEF', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, position: 'relative' },
  inputWithBtn: { flex: 1, height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, paddingRight: 80, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#EFEFEF', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  checkBtn: { position: 'absolute', right: 8, backgroundColor: '#F5F5F5', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  checkBtnText: { fontSize: 11, color: '#555', fontWeight: '600' },
  statusText: { fontSize: 11, marginLeft: 5, marginBottom: 10 },
  errorText: { fontSize: 12, marginLeft: 5, marginBottom: 10, color: '#FF5252', fontWeight:'600' },
  primaryButton: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  primaryButtonText: { color: '#333', fontSize: 15, fontWeight: 'bold' },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  linkText: { color: '#888', fontSize: 12 },
  linkTextBold: { color: '#555', fontSize: 12, fontWeight: 'bold' },
  separator: { width: 1, height: 10, backgroundColor: '#ddd', marginHorizontal: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 30, alignItems: 'center', elevation: 5 },
  modalText: { fontSize: 16, color: '#555', marginBottom: 5, textAlign: 'center' },
  modalIdText: { fontSize: 20, fontWeight: 'bold', color: '#4A90E2', marginBottom: 5, textAlign: 'center' },
});

export default AuthScreen;