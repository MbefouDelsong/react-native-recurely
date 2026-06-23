// import {View, Text} from 'react-native'
//
// const Onboarding = () => {
//     return (
//         <View>
//             <Text>Onboarding</Text>
//         </View>
//     )
// }
//
// export default Onboarding;
//
//


import { View, Text, Pressable, ImageBackground } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { icons } from "@/constants/icons";

const ONBOARDING_KEY = 'has_seen_onboarding';

const Onboarding = () => {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const insets = useSafeAreaInsets();

    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            const value = await AsyncStorage.getItem(ONBOARDING_KEY);
            setHasSeenOnboarding(value === 'true');
        };
        check();
    }, []);

    if (!isLoaded || hasSeenOnboarding === null) return null;

    if (isSignedIn) return <Redirect href="/(tabs)" />;

    if (hasSeenOnboarding) return <Redirect href="/(auth)/sign-in" />;

    const handleGetStarted = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        router.push('/(auth)/sign-up');
    };

    return (
        <ImageBackground
            source={icons.splash}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 28,
                    paddingTop: 32,
                    paddingBottom: insets.bottom + 36,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                }}>
                    <Text style={{
                        fontSize: 36,
                        fontWeight: '800',
                        color: 'white',
                        lineHeight: 44,
                        marginBottom: 10,
                    }}>
                        Gain Financial{'\n'}Clarity
                    </Text>

                    <Text style={{
                        fontSize: 16,
                        color: 'rgba(255,255,255,0.75)',
                        marginBottom: 36,
                    }}>
                        Track, analyze and cancel with ease.
                    </Text>

                    <Pressable
                        onPress={handleGetStarted}
                        style={{
                            backgroundColor: 'white',
                            paddingVertical: 18,
                            borderRadius: 100,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: '#1c1c2e',
                        }}>
                            Get Started
                        </Text>
                    </Pressable>
                </View>
            </View>
        </ImageBackground>
    );
};

export default Onboarding;