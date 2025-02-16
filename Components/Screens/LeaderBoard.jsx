import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'

const LeaderBoard = () => {

    const [selected, setSelected] = useState('weekly');
    const handlePress = (buttonType) => {
        setSelected(buttonType);
    };
    return (
        <View style={{ flex: 1, backgroundColor: '#6a5adf', padding: 25 }}>
            <View style={{alignItems: 'center', marginTop: 50 }}>
                <Text style={{ color: '#fff', fontSize: 24, marginBottom: 30}}>Leaderboard</Text>
            </View>
            <View style={styles.container}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: selected === 'weekly' ? '#9087e4' : 'transparent' }, // Thay đổi màu nền khi 'Weekly' được chọn
                    ]}
                    onPress={() => handlePress('weekly')}
                >
                    <Text style={styles.buttonText}>Weekly</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: selected === 'allTime' ? '#9087e4' : 'transparent' }, // Thay đổi màu nền khi 'All Time' được chọn
                    ]}
                    onPress={() => handlePress('allTime')}
                >
                    <Text style={styles.buttonText}>All Time</Text>
                </TouchableOpacity>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
                <View style={{backgroundColor:'#5144B6', borderRadius:10, width:122, height:34, justifyContent:'center', alignItems:'center', position:'absolute', left:230, top:0, flexDirection:'row'}}>
                    <Image source={require('../Images/clock1.png')} style={{width:20, height:20}}/>
                <Text style={{color:'#fff', marginLeft:5}}>06d 23h 00m</Text>
                </View>
              
                <Image source={require('../Images/BXH.png')} />
            </View>
            <View style={{borderRadius:25, height:280, width:'100%', backgroundColor:'#E6e6e6', position:'absolute', top: 550, left:25}}>

            </View>
        </View>
    )
}

export default LeaderBoard

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center', // Căn giữa các nút trong hàng
    },
    button: {
        width: '45%', // Đảm bảo hai nút có chiều rộng 50%, nhưng có một chút khoảng cách
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        marginHorizontal: 5, // Khoảng cách giữa các nút
    },
    buttonText: {
        fontSize: 16,
        color: '#fff', // Màu chữ
    },

})