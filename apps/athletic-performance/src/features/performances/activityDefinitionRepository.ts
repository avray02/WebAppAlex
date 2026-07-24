import { db, firebaseMode } from '@dailyme/auth'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import type { ActivityDefinition } from '../../types/performance'
import { activityDefinitions } from './performanceCatalog'

export async function listActivityDefinitions(canManage: boolean) {
  if (firebaseMode !== 'firebase' || !db) {
    return activityDefinitions
  }

  const firestore = db

  try {
    const snapshot = await getDocs(
      collection(firestore, 'activityDefinitions'),
    )
    const definitions = snapshot.docs
      .map(
        (definitionDocument) =>
          ({
            ...definitionDocument.data(),
            id: definitionDocument.id,
          }) as ActivityDefinition,
      )
      .filter(
        (definition) =>
          definition.active &&
          activityDefinitions.some(
            (supportedDefinition) =>
              supportedDefinition.id === definition.id,
          ),
      )

    if (definitions.length) {
      return definitions
    }

    if (canManage) {
      await Promise.all(
        activityDefinitions.map((definition) =>
          setDoc(
            doc(firestore, 'activityDefinitions', definition.id),
            definition,
          ),
        ),
      )
    }
  } catch (error) {
    console.warn('Activity definitions could not be loaded from Firestore', error)
  }

  return activityDefinitions
}
