import React, { useEffect, useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, AppState, Alert } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { String, LanguageContext } from "../components/Language";
import * as Sentry from '@sentry/react-native';

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

const NotificationSound = forwardRef((props, ref) => {
    const { dictionary } = useContext(LanguageContext);
    const soundRef = useRef(null);
    const repeatIntervalRef = useRef(null);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to foreground
                onStopPlaySound();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [appState]);

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
                // Just log audio errors, don't show to user
                console.log('Audio stop error (suppressed):', error);
                Sentry.captureException(error);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        playSound: async (options = {}) => {
            const { repeat = false, selectedSound = '1', volume = 1.0 } = options;
            await onPlaySound(repeat, selectedSound, volume);
        },
        stopSound: async () => {
            await onStopPlaySound();
        }
    }));

    const onPlaySound = async (repeat = false, selectedSound = '1', volume = 1.0) => {
        try {
            // Stop any existing sound first
            await onStopPlaySound();

            // Find the selected sound
            const music = musicList.find(m => m.id === selectedSound) || musicList[0];

            // Load and play sound
            const { sound } = await Audio.Sound.createAsync(
                music.source,
                { volume, shouldPlay: true }
            );

            soundRef.current = sound;
            
            // Configure repeat if needed
            if (repeat) {
                // Set up a repeat interval that waits for the sound to finish before playing again
                sound.setOnPlaybackStatusUpdate(async (status) => {
                    if (status.didJustFinish) {
                        try {
                            // Replay the sound
                            await sound.replayAsync();
                        } catch (error) {
                            // Silently log audio errors
                            console.log('Audio replay error (suppressed):', error);
                            Sentry.captureException(error);
                        }
                    }
                });
            }
        } catch (error) {
            // Just log audio errors, don't show to user
            console.log('Audio play error (suppressed):', error);
            Sentry.captureException(error);
        }
    };

    const loadAndPlaySavedMusic = async () => {
        try {
            const savedMusicId = await AsyncStorage.getItem('selectedMusicId');
            if (savedMusicId) {
                await onPlaySound(savedMusicId);
            } else {
                await onPlaySound('1');
            }
        } catch (error) {
            console.log('Error loading saved music:', error);
        }
    };

    const orderReceived = async () => {
        await loadAndPlaySavedMusic();
        Alert.alert(
            dictionary["general.alerts"],
            dictionary["orders.orderReceivedTitle"],
            [
                {
                    text: dictionary["okay"],
                    onPress: async () => {
                        await onStopPlaySound();
                    },
                },
            ],
            { cancelable: false }
        );
    };

    useImperativeHandle(ref, () => ({
        orderReceived,
    }));

    return <View />;
});

export default NotificationSound;
