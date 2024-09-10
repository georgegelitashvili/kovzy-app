import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Alert, View } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const musicList = [
    { id: '1', title: 'Plucky', source: require('../assets/audio/plucky.mp3') },
    { id: '2', title: 'Order', source: require('../assets/audio/order.mp3') },
    { id: '3', title: 'Definite', source: require('../assets/audio/definite-555.mp3') },
    { id: '4', title: 'Joyous chime', source: require('../assets/audio/joyous-chime-notification.mp3') },
    { id: '5', title: 'Light hearted tone', source: require('../assets/audio/light-hearted-message-tone.mp3') },
    { id: '6', title: 'Notification pretty good', source: require('../assets/audio/notification-pretty-good.mp3') },
    { id: '7', title: 'Pristine', source: require('../assets/audio/pristine-609.mp3') },
    { id: '8', title: 'Relax tone', source: require('../assets/audio/relax-message-tone.mp3') },
];

const NotificationManager = forwardRef((props, ref) => {
    const soundRef = useRef(null);
    const repeatIntervalRef = useRef(null);

    const onStopPlaySound = async () => {
        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                if (repeatIntervalRef.current) {
                    clearInterval(repeatIntervalRef.current);
                    repeatIntervalRef.current = null;
                }
            } catch (error) {
                console.log('Error stopping sound:', error);
            }
        }
    };

    const onPlaySound = async (musicId) => {
        const music = musicList.find((item) => item.id === musicId);
        if (!music) return;

        // Stop and unload previous sound if any
        if (soundRef.current) {
            await onStopPlaySound();
        }

        // Create and play new sound
        const { sound: newSound } = await Audio.Sound.createAsync(music.source);
        soundRef.current = newSound;
        try {
            await newSound.playAsync();
            // Loop sound until stopped
            newSound.setIsLoopingAsync(true);  // Set looping
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    };

    const loadAndPlaySavedMusic = async () => {
        try {
            const savedMusicId = await AsyncStorage.getItem('selectedMusicId');
            if (savedMusicId) {
                await onPlaySound(savedMusicId);
            }
        } catch (error) {
            console.log('Error loading saved music:', error);
        }
    };

    const orderReceived = async () => {
        await loadAndPlaySavedMusic();
        Alert.alert(
            "ALERT",
            "***New Order Received***",
            [
                {
                    text: "OK",
                    onPress: async () => {
                        await onStopPlaySound();
                    },
                },
            ],
            { cancelable: false } // Prevent dismissing the alert without pressing OK
        );
    };

    useImperativeHandle(ref, () => ({
        orderReceived,
    }));

    return <View />;
});

export default NotificationManager;
