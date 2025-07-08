import CustomButton from "@/components/CustomButton";
import CustomHeader from "@/components/CustomHeader";
import { images } from "@/constants";
import { account } from "@/lib/appwrite";
import { getUserProfile } from "@/lib/getUserProfile";
import useAuthStore from "@/store/auth.store";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const data = await getUserProfile(user.$id);
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  if (loading || !profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={[]} // لازم عشان التمرير يشتغل
        contentContainerClassName="pb-28 px-5 pt-5"
        ListHeaderComponent={() => <CustomHeader title="Profile" />}
        ListEmptyComponent={() => <Text></Text>}
        ListFooterComponent={() => (
          <View className="w-full">
            {/* Profile image */}
            <View className="items-center mt-6 mb-4">
              <View className="relative">
                <Image
                  source={{ uri: profile.avatar }}
                  className="w-28 h-28 rounded-full" />
                <TouchableOpacity
                  onPress={() => { } }
                  className="absolute bottom-0 right-0 w-8 h-8 bg-amber-500 rounded-full items-center justify-center shadow-md"
                  style={{ elevation: 4 }}
                >
                  <Image
                    source={images.pencil}
                    className="w-4 h-4"
                    resizeMode="contain"
                    tintColor="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Card */}
            <View
              className="bg-white rounded-2xl border border-orange-100 p-5 my-6 w-full"
              style={Platform.OS === "android"
                ? { elevation: 10, shadowColor: "#878787" }
                : {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                }}
            >
              {[
                {
                  label: "Full Name",
                  value: profile.name,
                  icon: images.person,
                },
                { label: "Email", value: profile.email, icon: images.envelope },
                {
                  label: "Phone number",
                  value: profile.phoneNumber,
                  icon: images.phone,
                },
                {
                  label: "Address 1 - (Home)",
                  value: profile.addressHome,
                  icon: images.location,
                },
                {
                  label: "Address 2 - (Work)",
                  value: profile.addressWork,
                  icon: images.location,
                },
              ].map((item, index) => (
                <View
                  key={index}
                  className={index !== 4
                    ? "flex-row items-center mb-[30px]"
                    : "flex-row items-center"}
                >
                  <View className="w-[48px] h-[48px] rounded-full bg-orange-100 items-center justify-center mr-[10px]">
                    <Image
                      source={item.icon}
                      className="w-[20px] h-[20px]"
                      resizeMode="contain"
                      style={{ tintColor: "#F59E0B" }} />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{ fontFamily: "Quicksand-Medium" }}
                      className="text-[14px] text-gray-400 mb-[2px]"
                    >
                      {item.label}
                    </Text>
                    {item.value && (
                      <Text
                        style={{ fontFamily: "Quicksand-SemiBold" }}
                        className="text-[16px] font-semibold text-gray-900"
                      >
                        {item.value}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Buttons */}
            <View className="gap-3">
              <CustomButton
                title="Edit Profile"
                style="bg-[#FAF5ED] border border-[#FE8C00]"
                textStyle="text-[#FE8C00]" />

              <CustomButton
                title="Log Out"
                leftIcon={<Image
                  source={images.logout}
                  className="w-6 h-6 mr-2"
                  resizeMode="contain"
                  tintColor="#F14141" />}
                style="bg-[#FAF1F1] border border-[#F14141]"
                textStyle="text-[#F14141]"
                onPress={async () => {
                  try {
                    await account.deleteSession("current");
                    useAuthStore.getState().logout();
                    router.replace("/sign-in");
                  } catch (error) {
                    console.error("Logout failed:", error);
                  }
                } } />
            </View>
          </View>
        )} renderItem={undefined}      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
