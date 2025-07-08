import { databases } from "@/lib/appwrite";
import { Query } from "react-native-appwrite";
import { appwriteConfig } from "@/lib/appwrite";

export const getUserProfile = async (userId: string) => {
  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    [Query.equal("$id", userId)]
  );
  return res.documents[0];
};
