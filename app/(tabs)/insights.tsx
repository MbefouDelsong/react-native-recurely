import { Text, View, ScrollView, Image } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useSubscriptionStore } from "@/lib/subscriptionStore";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import { useMemo } from "react";
import ListHeading from "@/components/ListHeading";

const SafeAreaView = styled(RNSafeAreaView);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CHART_HEIGHT = 140;

// Palette for history cards that have no color set
const CARD_COLORS = [
    '#ff6b6b', '#b8d4e3', '#e8def8', '#f5c542',
    '#95e1d3', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98', '#d4d4d4',
];

// Deterministic — same ID always gets same color across re-renders
const getCardColor = (id: string) => {
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return CARD_COLORS[hash % CARD_COLORS.length];
};

const Insights = () => {
    const { subscriptions } = useSubscriptionStore();

    const weeklySpending = useMemo(() => {
        const spending = new Array(7).fill(0);
        subscriptions
            .filter(sub => sub.status === 'active' && sub.renewalDate)
            .forEach(sub => {
                const day = dayjs(sub.renewalDate).day();
                const adjusted = day === 0 ? 6 : day - 1;
                spending[adjusted] += sub.price;
            });
        return spending;
    }, [subscriptions]);

    const maxSpending = Math.max(...weeklySpending, 1);
    const peakDayIndex = weeklySpending.indexOf(Math.max(...weeklySpending));

    const monthlyTotal = useMemo(() => {
        return subscriptions
            .filter(sub => sub.status === 'active')
            .reduce((sum, sub) => sum + (sub.billing === 'Yearly' ? sub.price / 12 : sub.price), 0);
    }, [subscriptions]);

    const sortedHistory = useMemo(() => {
        return [...subscriptions]
            .filter(sub => sub.renewalDate)
            .sort((a, b) => dayjs(a.renewalDate).diff(dayjs(b.renewalDate)));
    }, [subscriptions]);

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                <Text className="text-3xl font-sans-bold text-primary mb-4">Insights</Text>

                {/* --- Upcoming + Bar Chart --- */}
                <View >
                    <ListHeading title="Upcoming" />

                    <View className="auth-card !mt-3 " style={{ paddingVertical: 16, paddingHorizontal: 14 }}>
                        <View className="flex-row" style={{ height: CHART_HEIGHT + 24 }}>

                            {/* Y-axis labels */}
                            <View className="justify-between pr-3" style={{ height: CHART_HEIGHT, paddingTop: 16 }}>
                                {[45, 35, 25, 15, 5, 0].map(val => (
                                    <Text key={val} style={{ fontSize: 10 }} className="text-muted-foreground">
                                        {val}
                                    </Text>
                                ))}
                            </View>

                            {/* Bars */}
                            <View className="flex-1 flex-row items-end justify-around pb-5">
                                {DAYS.map((day, i) => {
                                    const barH = Math.max(
                                        (weeklySpending[i] / maxSpending) * (CHART_HEIGHT - 30), 6
                                    );
                                    const isPeak = i === peakDayIndex && weeklySpending[i] > 0;
                                    return (
                                        <View
                                            key={day}
                                            className="items-center justify-end"
                                            style={{ height: CHART_HEIGHT - 20 }}
                                        >
                                            {isPeak && (
                                                <View
                                                    style={{ backgroundColor: '#ff6b6b' }}
                                                    className="px-2 py-0.5 rounded-full mb-1"
                                                >
                                                    <Text style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>
                                                        ${Math.round(weeklySpending[i])}
                                                    </Text>
                                                </View>
                                            )}
                                            <View
                                                style={{
                                                    height: barH,
                                                    width: 18,
                                                    backgroundColor: isPeak ? '#ff6b6b' : '#1c1c2e',
                                                    borderRadius: 4,
                                                }}
                                            />
                                            <Text style={{ fontSize: 10 }} className="text-muted-foreground mt-1">
                                                {day}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>

                        </View>
                    </View>
                </View>

                {/* --- Expenses Summary --- */}
                <View className="auth-card !mt-3" style={{ paddingVertical: 16 }}>
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-base font-sans-bold text-primary">Expenses</Text>
                            <Text className="text-sm font-sans-medium text-muted-foreground">
                                {dayjs().format('MMMM YYYY')}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-base font-sans-bold text-primary">
                                -{formatCurrency(monthlyTotal)}
                            </Text>
                            <Text className="text-sm font-sans-medium" style={{ color: '#22c55e' }}>
                                +12%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* --- History --- */}
                <View>
                    <ListHeading title="History" />

                    {sortedHistory.length === 0 ? (
                        <Text className="text-sm font-sans-medium text-muted-foreground text-center">
                            No subscription history yet.
                        </Text>
                    ) : (
                        sortedHistory.map(sub => {
                            const bgColor = sub.color || getCardColor(sub.id);
                            return (
                                <View
                                    key={sub.id}
                                    className="auth-card !mt-3 "
                                    style={{ backgroundColor: bgColor, paddingVertical: 14 }}
                                >
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-1">
                                            <View
                                                className="rounded-2xl items-center justify-center"
                                                style={{
                                                    width: 46,
                                                    height: 46,
                                                    backgroundColor: 'rgba(255,255,255,0.35)',
                                                }}
                                            >
                                                <Image
                                                    source={sub.icon}
                                                    style={{ width: 26, height: 26 }}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <View>
                                                <Text className="text-base font-sans-bold text-primary">
                                                    {sub.name}
                                                </Text>
                                                <Text
                                                    className="text-sm font-sans-medium text-primary"
                                                    style={{ opacity: 0.65 }}
                                                >
                                                    {dayjs(sub.renewalDate).format('MMMM D, HH:mm')}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="items-end">
                                            <Text className="text-base font-sans-bold text-primary">
                                                {formatCurrency(sub.price)}
                                            </Text>
                                            <Text
                                                className="text-sm font-sans-medium text-primary"
                                                style={{ opacity: 0.65 }}
                                            >
                                                per {sub.billing?.toLowerCase() === 'yearly' ? 'year' : 'month'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default Insights;