// import {View, Text, Image} from 'react-native'
// import React from 'react'
// import {formatCurrency} from "@/lib/utils";

// const UpcomingSubscriptionCard = ({ name, price, daysLeft, icon, currency }: UpcomingSubscription) => {
//     return (
//         <View className="upcoming-card">
//             <View className="upcoming-row">
//                 <Image source={icon} className="upcoming-icon" />
//                 <View>
//                     <Text className="upcoming-price">{formatCurrency(price, currency)}</Text>
//                     <Text className="upcoming-meta" numberOfLines={1}>
//                         {daysLeft > 1 ? `${daysLeft} days left` : 'Last day'}
//                     </Text>
//                 </View>
//             </View>

//             <Text className="upcoming-name" numberOfLines={1}>{name}</Text>
//         </View>
//     )
// }
// export default UpcomingSubscriptionCard

import {View, Text, Image, ImageSourcePropType} from 'react-native'
import React from 'react'
import {formatCurrency} from "@/lib/utils";

// 1. Notice the '?' makes it optional now, clearing the mapping error!
interface UpcomingSubscription {
    id: string;
    icon: ImageSourcePropType;
    name: string;
    price: number;
    currency?: string;
    daysLeft?: number; 
}

const UpcomingSubscriptionCard = ({ name, price, daysLeft, icon, currency }: UpcomingSubscription) => {
    return (
        <View className="upcoming-card">
            <View className="upcoming-row">
                <Image source={icon} className="upcoming-icon" />
                <View>
                    <Text className="upcoming-price">{formatCurrency(price, currency)}</Text>
                    <Text className="upcoming-meta" numberOfLines={1}>
                        {/* 2. Safe evaluation fallback */}
                        {daysLeft === undefined 
                            ? 'Upcoming' 
                            : daysLeft > 1 
                                ? `${daysLeft} days left` 
                                : 'Last day'}
                    </Text>
                </View>
            </View>

            <Text className="upcoming-name" numberOfLines={1}>{name}</Text>
        </View>
    )
}
export default UpcomingSubscriptionCard