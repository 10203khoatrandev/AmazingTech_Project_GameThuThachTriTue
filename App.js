import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LeaderBoard from './Components/Screens/LeaderBoard';
import Home from './Components/Screens/Home';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
     {/* <LeaderBoard/> */}
     <Home/>
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
