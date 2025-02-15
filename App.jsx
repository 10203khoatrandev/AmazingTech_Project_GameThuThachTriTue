import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LeaderBoard from './Components/Screens/LeaderBoard';
import Home from './Components/Screens/Home';
import ProfileScreen from './Components/Screens/Profile';
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
     {/* <LeaderBoard/> */}
     <ProfileScreen/>
    //  <Home/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width:'100%',
    height:'100%'
  },
});
