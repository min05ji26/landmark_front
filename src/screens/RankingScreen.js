import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getItem } from '../utils/authStorage';
import { API_URL } from '../constants/constants';


const ITEMS_PER_PAGE = 10; 

export default function RankingScreen() {
  const navigation = useNavigation();
  const [allRankingList, setAllRankingList] = useState([]); 
  const [displayedRankingList, setDisplayedRankingList] = useState([]); 
  const [selectedUser, setSelectedUser] = useState(null); 
  const [currentDateStr, setCurrentDateStr] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekNo = Math.ceil((((now - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
    setCurrentDateStr(`${month}월 ${weekNo}째주 주간랭킹`);

    fetchRanking();
  }, []);
  
  useEffect(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setDisplayedRankingList(allRankingList.slice(start, end));
  }, [currentPage, allRankingList]);

  const fetchRanking = async () => {
    try {
      const token = await getItem('userToken');
      const response = await fetch(`${API_URL}/api/ranking/weekly`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json();
      
      if (json.success) {
        const data = json.data;
        setAllRankingList(data); 
        setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE)); 

        if (data.length > 0) {
          setSelectedUser(data[0]);
        }
      }
    } catch (error) {
      console.error('랭킹 로드 실패', error);
      // 🚨 [수정] 가짜 데이터(Mock Data) 삭제함
      // 에러 나면 빈 화면이나 에러 메시지 표시
    } finally {
        setLoading(false);
    }
  };
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const newIndex = (page - 1) * ITEMS_PER_PAGE;
      if (allRankingList[newIndex]) {
          setSelectedUser(allRankingList[newIndex]);
      }
    }
  };
  
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.listRow, 
        selectedUser?.userId === item.userId && styles.selectedRow 
      ]}
      onPress={() => setSelectedUser(item)} 
    >
      <Text style={styles.rowRank}>{item.rank}위</Text>
      <View style={styles.rowAvatar} />
      <View style={styles.rowInfo}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.rowName}>{item.nickname}</Text>
          {item.representativeTitle ? (
             <Text style={styles.rowTitleBadge}>{item.representativeTitle}</Text>
          ) : null}
        </View>
        <Text style={styles.rowLocation}>{item.currentLandmark}</Text>
      </View>
      <Text style={styles.rowSteps}>{item.totalSteps.toLocaleString()} 걸음</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 10}}>
          <Text style={{fontSize: 24, color: '#A0C4FF'}}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}></Text>
        <View style={{width: 30}} />
      </View>

      <View style={styles.medalSection}>
        <Text style={{fontSize: 60}}>🏵️</Text>
        <Text style={styles.dateText}>{currentDateStr}</Text>
      </View>

      <View style={styles.rankingCard}>
        {selectedUser ? (
          <View style={styles.topProfile}>
            <Text style={styles.rankBig}>{selectedUser.rank}위</Text>
            <View style={styles.avatarBig} />
            <Text style={styles.nicknameBig}>{selectedUser.nickname}</Text>
            <Text style={styles.locationBig}>{selectedUser.currentLandmark}</Text>
            <Text style={styles.stepsBig}>{selectedUser.totalSteps.toLocaleString()} 걸음</Text>
          </View>
        ) : (
          <Text style={{textAlign:'center', margin: 20}}>
            {loading ? "로딩 중..." : "랭킹 데이터가 없습니다."}
          </Text>
        )}

        <View style={styles.divider} />

        {loading ? (
            <Text style={{textAlign:'center', marginTop: 20}}>로딩 중...</Text>
        ) : (
            <FlatList
              data={displayedRankingList} 
              keyExtractor={(item) => item.userId.toString()}
              renderItem={renderItem}
              style={{width: '100%'}}
              contentContainerStyle={{paddingBottom: 20}}
              scrollEnabled={false} 
            />
        )}
        
        <View style={styles.pagination}>
          <TouchableOpacity 
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Text style={[styles.pageArrow, currentPage === 1 && {opacity: 0.3}]}>{"<"}</Text>
          </TouchableOpacity>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <TouchableOpacity 
              key={page} 
              onPress={() => handlePageChange(page)}
              style={styles.pageNumberBox}
            >
              <Text style={[
                styles.pageNumber, 
                currentPage === page && styles.activePageNumber
              ]}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text style={[styles.pageArrow, currentPage === totalPages && {opacity: 0.3}]}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 10
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  medalSection: { alignItems: 'center', marginVertical: 10 },
  dateText: { color: '#888', fontSize: 13, marginTop: 10 },
  rankingCard: {
    flex: 1, backgroundColor: 'white', 
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 25, paddingTop: 25,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 }, shadowRadius: 10, elevation: 10
  },
  topProfile: { alignItems: 'center', marginBottom: 15 },
  rankBig: { fontSize: 28, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  avatarBig: { 
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#555', marginBottom: 10 
  },
  nicknameBig: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  locationBig: { fontSize: 13, color: '#999', marginBottom: 8 },
  stepsBig: { fontSize: 28, fontWeight: 'bold', color: '#4A90E2' },
  divider: { width: '100%', height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  listRow: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' 
  },
  selectedRow: { backgroundColor: '#F0F8FF' }, 
  rowRank: { fontWeight: 'bold', width: 40, fontSize: 16, color: '#333' },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CCC', marginRight: 12 },
  rowInfo: { flex: 1 },
  rowName: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  rowTitleBadge: { 
    fontSize: 10, color: '#4A90E2', backgroundColor: '#EAF3FF', 
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6, overflow: 'hidden'
  },
  rowLocation: { fontSize: 11, color: '#AAA', marginTop: 2 },
  rowSteps: { fontSize: 13, color: '#666' },
  pagination: { 
      flexDirection: 'row', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginTop: 10 
  },
  pageNumberBox: { paddingHorizontal: 8, paddingVertical: 5 },
  pageNumber: { fontSize: 16, color: '#888' },
  activePageNumber: { color: '#333', fontWeight: 'bold', textDecorationLine: 'underline' },
  pageArrow: { fontSize: 16, color: '#888', paddingHorizontal: 5 }
});