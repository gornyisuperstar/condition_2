import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";

/**
 * Регистрация клиента (организации) по коду
 * 
 * @param {string} orgCode - код организации (из коллекции orgCodes)
 * @param {string} email - email для входа
 * @param {string} password - пароль
 * @param {string} name - название организации
 * @param {string} phone - телефон организации
 */
export async function registerOrganizationWithCode(orgCode, email, password, name, phone) {
  try {
    // 1. Проверяем orgCode
    const codeRef = doc(db, "orgCodes", orgCode);
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      throw new Error("Invalid organization code");
    }
    if (codeSnap.data().used) {
      throw new Error("Organization code already used");
    }

    // 2. Создаём пользователя в Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 3. Создаём запись в users
    await setDoc(doc(db, "users", user.uid), {
      email,
      role: "client",
      orgId: user.uid,
      createdAt: serverTimestamp(),
    });

    // 4. Создаём запись в organizations
    await setDoc(doc(db, "organizations", user.uid), {
      name,
      email,
      phone,
      territory: [], // пустой массив
      createdAt: serverTimestamp(),
    });

    // 5. Помечаем orgCode как использованный
    await updateDoc(codeRef, { used: true });

    return user;
  } catch (error) {
    console.error("Error creating organization:", error.message);
    throw error;
  }
}
