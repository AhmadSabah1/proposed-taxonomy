import {
    addDoc,
    collection,
    doc,
    DocumentReference,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc
} from 'firebase/firestore';
import {Category} from '@/app/models/Category';
import {db} from "../../firebaseConfig";
import {Literature} from '@/app/models/Literature';

// Define the type for the document data
interface CategoriesDoc {
    categories: Category[];
}

// Utility function to remove undefined fields
const removeUndefinedFields = (obj: any) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, any>);
};

// Function to save categories to Firestore
export const saveCategories = async (categories: Category[]): Promise<void> => {
    try {
        // Sanitize each category object
        const sanitizedCategories = categories.map((category) =>
            removeUndefinedFields({
                ...category,
                parentCategoryId: category.parentCategoryId ?? null, // Replace undefined with null
            })
        );

        const docRef: DocumentReference<CategoriesDoc> = doc(db, 'trees', 'categories') as DocumentReference<CategoriesDoc>;

        // Save sanitized data to Firestore
        await setDoc(docRef, {categories: sanitizedCategories});
        console.log('Categories saved successfully');
    } catch (error) {
        console.error('Error saving categories:', error instanceof Error ? error.message : error);
        throw new Error('Failed to save categories.');
    }
};

// Function to retrieve categories from Firestore
export const getCategories = async (): Promise<Category[]> => {
    try {
        const docRef: DocumentReference<CategoriesDoc> = doc(db, 'trees', 'categories') as DocumentReference<CategoriesDoc>;
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.categories;
        } else {
            console.log('No categories found');
            return [];
        }
    } catch (error) {
        console.error('Error fetching categories:', error instanceof Error ? error.message : error);
        return [];
    }
};
export const subscribeToCategories = (
    onCategoriesChange: (categories: Category[]) => void
): (() => void) => {
    const docRef: DocumentReference<{ categories: Category[] }> = doc(
        db,
        'trees',
        'categories'
    ) as DocumentReference<{ categories: Category[] }>;

    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            onCategoriesChange(data.categories);
        } else {
            onCategoriesChange([]);
        }
    });
};

export const subscribeToLiterature = (
    onLiteratureChange: (literatureList: Literature[]) => void
): (() => void) => {
    try {
        const literatureCollection = collection(db, 'literature');
        const literatureQuery = query(literatureCollection, orderBy('sortOrder', 'desc'));

        return onSnapshot(literatureQuery, (snapshot) => {
            const literatureData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Literature, 'id'>),
            }));
            onLiteratureChange(literatureData.sort(s => s.sortOrder!));
        }); // Call this function to stop listening
    } catch (error) {
        console.error('Error setting up literature subscription:', error);
        throw error;
    }
};

export const addNewLiterature = async (newLiterature: Omit<Literature, 'id' | 'sortOrder'>) => {
    try {
        const literatureCollection = collection(db, 'literature');
        const literatureSnapshot = await getDocs(literatureCollection);

        // Find the highest sortOrder
        const highestSortOrder = literatureSnapshot.docs.reduce((max, doc) => {
            const sortOrder = doc.data()?.sortOrder || 0;
            return Math.max(max, sortOrder);
        }, 0);

        // Assign sortOrder to the new item
        await addDoc(literatureCollection, {
            ...newLiterature,
            sortOrder: highestSortOrder + 1,
        });

    } catch (error) {
        console.error('Error adding literature:', error);
    }
};