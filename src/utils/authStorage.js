// project/utils/authStorage.js (신규 파일)

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getItem = async (key) => {
    if (Platform.OS === 'web') {
        // 웹 브라우저 (디버깅 환경)
        return localStorage.getItem(key);
    }
    // 모바일 앱 (최종 환경)
    return SecureStore.getItemAsync(key);
}

const deleteItem = async (key) => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
    }
    await SecureStore.deleteItemAsync(key);
}

const setItem = async (key, value) => {
    if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
    }
    // setValueWithKeyAsync 대신 setItemAsync이 표준이며, 임포트된 SecureStore 객체에 직접 존재합니다.
    await SecureStore.setItemAsync(key, value); 
}

// ⚠️ 참고: setItem/deleteItem/getItem만으로 충분하며, 
// 기존 코드의 setValueWithKeyAsync() 호출은 setItem()으로 대체됩니다.
export { getItem, deleteItem, setItem };