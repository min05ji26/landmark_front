import Constants from "expo-constants";
import { Platform } from "react-native";

// 🚀 [마법의 코드] 현재 실행 중인 컴퓨터의 IP를 자동으로 가져옵니다.
const debuggerHost = Constants.expoConfig?.hostUri; 
const localhost = debuggerHost?.split(":")[0];

// 웹이면 localhost, 앱이면 자동으로 찾은 IP를 사용합니다.
// 만약 IP를 못 찾으면 안전장치로 데스크탑 IP(113)를 씁니다.
export const API_URL = Platform.OS === "web"
  ? "http://localhost:8080"
  : `http://${localhost || '192.168.219.113'}:8080`;

// 콘솔에 현재 연결된 주소를 찍어줍니다 (디버깅용)
if (Platform.OS !== "web") {
  console.log(`📡 [API 연결] 현재 서버 주소: ${API_URL}`);
}