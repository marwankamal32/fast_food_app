import * as FileSystem from "expo-file-system";
import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[];
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
  const list = await databases.listDocuments(
    appwriteConfig.databaseId,
    collectionId
  );

  for (const doc of list.documents) {
    console.log(`🗑️ Deleting document ${doc.$id} in ${collectionId}`);
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      collectionId,
      doc.$id
    );
    await new Promise((r) => setTimeout(r, 100)); // delay بسيط
  }
}

async function clearStorage(): Promise<void> {
  const list = await storage.listFiles(appwriteConfig.bucketId);

  for (const file of list.files) {
    console.log(`🗑️ Deleting file ${file.$id}`);
    await storage.deleteFile(appwriteConfig.bucketId, file.$id);
    await new Promise((r) => setTimeout(r, 100));
  }
}

async function uploadImageToStorage(imageUrl: string): Promise<string> {
  console.log(`⬇️ Downloading image: ${imageUrl}`);

  const fileName = imageUrl.split("/").pop() || `file-${Date.now()}.jpg`;
  const localUri = FileSystem.cacheDirectory + fileName;

  // Download image
  const downloadRes = await FileSystem.downloadAsync(imageUrl, localUri);
  console.log(`✅ Downloaded to: ${downloadRes.uri}`);

  // 2. Get file info (to get size)
  const fileInfo = await FileSystem.getInfoAsync(downloadRes.uri);
  if (!fileInfo.exists) throw new Error("File not found");

  // Create file in Appwrite
  const file = await storage.createFile(appwriteConfig.bucketId, ID.unique(), {
    uri: downloadRes.uri,
    name: fileName,
    type: "image/jpeg",
    size: fileInfo.size ?? 0,
  });

  const url = storage.getFileViewURL(appwriteConfig.bucketId, file.$id).href;
  console.log(`✅ Uploaded: ${url}`);
  return url;
}

async function seed(): Promise<void> {
  console.log("🚀 Starting seeding process...");

  try {
    console.log("🔄 Clearing collections...");
    await clearAll(appwriteConfig.categoriesCollectionId);
    await clearAll(appwriteConfig.customizationsCollectionId);
    await clearAll(appwriteConfig.menuCollectionId);
    await clearAll(appwriteConfig.menuCustomizationsCollectionId);
    await clearStorage();
    console.log("✅ Collections cleared.");
  } catch (err) {
    console.error("❌ Error clearing data:", err);
    return;
  }

  const categoryMap: Record<string, string> = {};
  const customizationMap: Record<string, string> = {};
  const menuMap: Record<string, string> = {};

  try {
    console.log("✨ Creating categories...");
    for (const cat of data.categories) {
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.categoriesCollectionId,
        ID.unique(),
        cat
      );
      categoryMap[cat.name] = doc.$id;
      console.log(`✅ Category created: ${cat.name}`);
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch (err) {
    console.error("❌ Error creating categories:", err);
    return;
  }

  try {
    console.log("✨ Creating customizations...");
    for (const cus of data.customizations) {
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.customizationsCollectionId,
        ID.unique(),
        {
          name: cus.name,
          price: cus.price,
          type: cus.type,
        }
      );
      customizationMap[cus.name] = doc.$id;
      console.log(`✅ Customization created: ${cus.name}`);
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch (err) {
    console.error("❌ Error creating customizations:", err);
    return;
  }

  try {
    console.log("✨ Creating menu items...");
    for (const item of data.menu) {
      console.log(`🍔 Processing menu item: ${item.name}`);
      const uploadedImage = await uploadImageToStorage(item.image_url);
      await new Promise((r) => setTimeout(r, 200));

      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuCollectionId,
        ID.unique(),
        {
          name: item.name,
          description: item.description,
          image_url: uploadedImage,
          price: item.price,
          rating: item.rating,
          calories: item.calories,
          protein: item.protein,
          categories: categoryMap[item.category_name],
        }
      );
      menuMap[item.name] = doc.$id;
      console.log(`✅ Menu item created: ${item.name}`);
      await new Promise((r) => setTimeout(r, 200));

      console.log(`🔗 Creating menu_customizations for: ${item.name}`);
      for (const cusName of item.customizations) {
        await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuCustomizationsCollectionId,
          ID.unique(),
          {
            menu: doc.$id,
            customizations: customizationMap[cusName],
          }
        );
        console.log(`✅ Linked customization: ${cusName}`);
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  } catch (err) {
    console.error("❌ Error creating menu items:", err);
    return;
  }

  console.log("🎉✅ Seeding complete.");
}

export default seed;
