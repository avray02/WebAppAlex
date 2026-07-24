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
      .map((definitionDocument) => {
        const supportedDefinition = activityDefinitions.find(
          (definition) => definition.id === definitionDocument.id,
        )

        return supportedDefinition
          ? ({
              ...supportedDefinition,
              ...definitionDocument.data(),
              environment: supportedDefinition.environment,
              id: definitionDocument.id,
            } as ActivityDefinition)
          : null
      })
      .filter(
        (definition): definition is ActivityDefinition =>
          Boolean(definition?.active),
      )

    if (canManage) {
      await Promise.all(
        activityDefinitions.map((definition) =>
          setDoc(
            doc(firestore, 'activityDefinitions', definition.id),
            definition,
          ),
        ),
      )
      return activityDefinitions
    }

    if (definitions.length) {
      return definitions
    }
  } catch (error) {
    console.warn('Activity definitions could not be loaded from Firestore', error)
  }

  return activityDefinitions
}
