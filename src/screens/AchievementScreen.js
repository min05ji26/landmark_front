import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  SafeAreaView, ActivityIndicator, Modal, Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getItem } from '../utils/authStorage'; 
import { API_URL } from '../constants/constants'; 

export default function AchievementScreen() {
  const navigation = useNavigation();
  
  const [achievements, setAchievements] = useState([]);
  const [myTotalSteps, setMyTotalSteps] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getItem('userToken');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const userRes = await fetch(`${API_URL}/api/user/info`, { headers });
      const userJson = await userRes.json();
      if (userJson.success) {
        setMyTotalSteps(userJson.data.totalSteps);
      }

      const achRes = await fetch(`${API_URL}/api/achievements/list`, { headers });
      const achJson = await achRes.json();
      if (achJson.success) {
        setAchievements(achJson.data);
      }

    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id, name) => {
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${API_URL}/api/achievements/${id}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json();

      if (json.success) {
        setPopupMessage(`축하합니다!\n'${name}' 업적을 달성하셨습니다!`);
        setPopupVisible(true);
        
        setTimeout(() => {
            setPopupVisible(false);
        }, 3000);

        fetchData();
      } else {
        Alert.alert("알림", json.message || "업적 획득 실패");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "서버 통신 실패");
    }
  };

  const renderItem = ({ item }) => {
    // 서버에서 계산된 값 사용
    const isCompleted = item.unlocked; 
    const canClaim = !isCompleted && item.conditionMet; 

    return (
      <View style={styles.card}>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
          
          {/* 조건 텍스트 표시 */}
          <Text style={styles.condition}>
             {item.conditionText}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
            {isCompleted ? (
                // 완료 상태
                <TouchableOpacity 
                    style={[styles.claimButton, styles.disabledButton]}
                    disabled={true}
                >
                    <Text style={[styles.claimText, {color: '#999'}]}>완료</Text>
                </TouchableOpacity>
            ) : (
                // 미완료 상태 (획득 가능 or 진행중)
                <TouchableOpacity 
                    style={[styles.claimButton, !canClaim && styles.disabledButton]}
                    onPress={() => {
                        if(canClaim) handleClaim(item.id, item.name);
                        else Alert.alert("알림", `아직 조건을 달성하지 못했습니다.`);
                    }}
                    activeOpacity={canClaim ? 0.7 : 1}
                >
                    <Text style={[styles.claimText, !canClaim && {color:'#999'}]}>
                        {canClaim ? "획득" : "진행중"}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4A90E2" />
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
          <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>업적</Text>
        <View style={{width: 30}} /> 
      </View>

      <FlatList
        data={achievements}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>업적 목록이 없습니다.</Text>}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={popupVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.popupOverlay}>
            <View style={styles.popupContent}>
                <Text style={{fontSize: 40, marginBottom: 10}}>🏆</Text>
                <Text style={styles.popupText}>{popupMessage}</Text>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  card: {
    backgroundColor: '#fff', borderRadius: 15, marginBottom: 15,
    padding: 15, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, 
    shadowOffset: {width:0, height:2}, elevation: 2
  },
  
  textContainer: { flex: 1, marginRight: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' },
  
  title: { fontSize: 16, fontWeight: 'bold', color: '#4A90E2', marginRight: 8 },
  description: { fontSize: 12, color: '#888', marginBottom: 4 },
  condition: { fontSize: 11, color: '#555' },

  buttonContainer: { justifyContent: 'center' },
  claimButton: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#4A90E2',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, minWidth: 60, alignItems: 'center'
  },
  disabledButton: { borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  claimText: { color: '#4A90E2', fontWeight: 'bold', fontSize: 12 },
  
  emptyText: { textAlign: 'center', marginTop: 50, color: '#aaa' },

  popupOverlay: { 
      flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', 
      justifyContent: 'center', alignItems: 'center' 
  },
  popupContent: { 
      width: '80%', backgroundColor: '#fff', borderRadius: 20, 
      padding: 30, alignItems: 'center', elevation: 5 
  },
  popupText: { 
      fontSize: 18, fontWeight: 'bold', color: '#333', 
      textAlign: 'center', lineHeight: 26 
  }
});