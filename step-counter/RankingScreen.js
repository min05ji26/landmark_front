import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './constants';

const RankingScreen = ({ onBack }) => { // onBack prop 추가
  const [rankingList, setRankingList] = useState([]);
  const [myRankData, setMyRankData] = useState(null);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      // 실제 API 호출
      const response = await fetch(`${API_URL}/api/ranking/weekly`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json();
      
      if (json.success) {
        setRankingList(json.data);
        // 내 랭킹 찾기 (예시 로직: 일단 첫번째 사람을 나라고 가정하거나 별도 API 필요)
        if(json.data.length > 0) setMyRankData(json.data[0]); 
      }
    } catch (error) {
      console.log('랭킹 로드 실패', error);
      // 실패 시 가짜 데이터
      const mockData = [
        { userId: 1, rank: 1, nickname: "장경준", totalSteps: 5800, representativeTitle: "리액트 장인" },
        { userId: 2, rank: 2, nickname: "낑깡", totalSteps: 3600, representativeTitle: "오사카 여행자" },
        { userId: 3, rank: 3, nickname: "개발자", totalSteps: 2100, representativeTitle: "코딩중" },
      ];
      setRankingList(mockData);
      setMyRankData(mockData[1]);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.listRow}>
      <Text style={styles.rowRank}>{item.rank}위</Text>
      <View style={styles.rowAvatar} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.nickname}</Text>
        <Text style={styles.rowSteps}>{item.totalSteps.toLocaleString()} 걸음</Text>
      </View>
      <Text style={styles.rowMsg}>{item.representativeTitle || '-'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{fontSize: 16, color:'#333'}}>⬅ Back</Text>
        </TouchableOpacity>
        <Text style={{fontWeight:'bold'}}>주간 랭킹</Text>
        <View style={{width:40}} /> 
      </View>

      <View style={styles.medalSection}>
        <Text style={{fontSize: 50}}>🥇</Text>
        <Text style={{color:'#888', fontSize:12, marginTop:5}}>이번 주 랭킹</Text>
      </View>

      {/* 랭킹 카드 패널 */}
      <View style={styles.rankingCard}>
        
        {/* 상단 내 프로필 (또는 1위) */}
        {myRankData && (
          <View style={styles.topProfile}>
            <Text style={styles.rankBadge}>{myRankData.rank}위</Text>
            <View style={styles.avatar} /> 
            <Text style={styles.nickname}>{myRankData.nickname}</Text>
            <Text style={styles.statusMsg}>{myRankData.representativeTitle}</Text>
            <Text style={styles.stepCount}>{myRankData.totalSteps?.toLocaleString()} 걸음</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* 리스트 */}
        <FlatList
          data={rankingList}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={renderItem}
          style={{width: '100%'}}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8', padding: 20 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 
  },
  medalSection: { alignItems: 'center', marginBottom: 20 },
  rankingCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 30,
    padding: 20, alignItems: 'center', elevation: 5, shadowOpacity: 0.1
  },
  topProfile: { alignItems: 'center', marginBottom: 20 },
  avatar: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#ddd', marginBottom: 10 
  },
  rankBadge: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  nickname: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusMsg: { fontSize: 12, color: '#999', marginTop: 5 },
  stepCount: { fontSize: 24, fontWeight: 'bold', color: '#4A90E2', marginTop: 10 },
  
  divider: { width: '100%', height: 1, backgroundColor: '#eee', marginVertical: 15 },

  listRow: { 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' 
  },
  rowRank: { fontWeight: 'bold', width: 40, color: '#666' },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', marginRight: 15 },
  rowInfo: { flex: 1 },
  rowName: { fontWeight: 'bold', fontSize: 14 },
  rowSteps: { fontSize: 12, color: '#888' },
  rowMsg: { color: '#4A90E2', fontSize: 12, textAlign: 'right' }
});

export default RankingScreen;