import { Text, View, Pressable, Image, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useClerk, useUser } from '@clerk/expo';
import images from '@/constants/images';
import { usePostHog } from 'posthog-react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
    const { signOut } = useClerk();
    const { user } = useUser();
    const posthog = usePostHog();

    const [isEditingName, setIsEditingName] = useState(false);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [isSaving, setIsSaving] = useState(false);

    const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';
    const email = user?.emailAddresses[0]?.emailAddress;
    const isVerified = user?.emailAddresses[0]?.verification?.status === 'verified';

    const handleSignOut = async () => {
        posthog.capture('user_signed_out');
        try {
            await signOut();
            posthog.reset();
        } catch (error) {
            console.error('Sign-out failed:', error);
        }
    };

    const handleSaveName = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await user.update({ firstName, lastName });
            setIsEditingName(false);
            posthog.capture('user_profile_updated', { field: 'name' });
        } catch {
            Alert.alert('Error', 'Failed to update name. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setIsEditingName(false);
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            try {
                const response = await fetch(result.assets[0].uri);
                const blob = await response.blob();
                await user?.setProfileImage({ file: blob });
                posthog.capture('user_profile_updated', { field: 'avatar' });
            } catch {
                Alert.alert('Error', 'Failed to update profile picture.');
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            >
                <Text className="text-3xl font-sans-bold text-primary mb-5">Settings</Text>

                {/* ── Profile ── */}
                <View className="auth-card mb-4">

                    {/* Avatar */}
                    <View className="items-center mb-5">
                        <Pressable onPress={handlePickImage}>
                            <Image
                                source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                                style={{ width: 88, height: 88, borderRadius: 44 }}
                            />
                            <View style={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 26, height: 26, borderRadius: 13,
                                backgroundColor: '#1c1c2e',
                                borderWidth: 2, borderColor: 'white',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Text style={{ fontSize: 11 }}>✏️</Text>
                            </View>
                        </Pressable>
                    </View>

                    {/* Name */}
                    {isEditingName ? (
                        <View style={{ gap: 12 }}>
                            <View className="auth-field">
                                <Text className="auth-label">First Name</Text>
                                <TextInput
                                    className="auth-input"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="First name"
                                    placeholderTextColor="rgba(0,0,0,0.4)"
                                />
                            </View>
                            <View className="auth-field">
                                <Text className="auth-label">Last Name</Text>
                                <TextInput
                                    className="auth-input"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Last name"
                                    placeholderTextColor="rgba(0,0,0,0.4)"
                                />
                            </View>
                            <View className="flex-row gap-3">
                                <Pressable
                                    className="flex-1 auth-button"
                                    onPress={handleSaveName}
                                    disabled={isSaving}
                                >
                                    <Text className="auth-button-text">
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    className="flex-1 auth-secondary-button"
                                    onPress={handleCancelEdit}
                                >
                                    <Text className="auth-secondary-button-text  pt-1.5 !text-base">Cancel</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <View className="items-center" style={{ gap: 4 }}>
                            <Text className="text-xl font-sans-bold text-primary">{displayName}</Text>
                            {email && (
                                <Text className="text-sm font-sans-medium text-muted-foreground">
                                    {email}
                                </Text>
                            )}
                            <Pressable
                                className="auth-secondary-button mt-2"
                                onPress={() => setIsEditingName(true)}
                            >
                                <Text className="auth-secondary-button-text pl-2 pr-2">Edit Name</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* ── Account Details ── */}
                <View className="auth-card mb-5">
                    <Text className="text-base font-sans-semibold text-primary mb-2">Account</Text>

                    {[
                        {
                            label: 'Member Since',
                            value: user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : 'N/A',
                        },
                        {
                            label: 'Email',
                            value: email || 'N/A',
                        },
                        {
                            label: 'Email Status',
                            value: isVerified ? '✓ Verified' : 'Unverified',
                            valueColor: isVerified ? '#22c55e' : '#ef4444',
                        },
                    ].map((row, i, arr) => (
                        <View
                            key={row.label}
                            className="flex-row justify-between items-center py-2"
                            style={i < arr.length - 1
                                ? { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }
                                : undefined}
                        >
                            <Text className="text-sm font-sans-medium text-muted-foreground">
                                {row.label}
                            </Text>
                            <Text
                                className="text-sm font-sans-medium"
                                style={{ color: row.valueColor || '#1c1c2e', maxWidth: '55%' }}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {row.value}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ── Sign Out ── */}
                <Pressable className="auth-button" onPress={handleSignOut}>
                    <Text className="auth-button-text">Sign Out</Text>
                </Pressable>

            </ScrollView>
        </SafeAreaView>
    );
};

export default Settings;