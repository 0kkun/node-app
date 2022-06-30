import { db } from '../lib/firebaseAdmin'

export type Document<T> = {
  readonly id: string
  readonly ref: FirebaseFirestore.DocumentReference
  readonly exists: boolean
  data: () => T
}

export type Where = {
  fieldPath: string | FirebaseFirestore.FieldPath
  opStr: FirebaseFirestore.WhereFilterOp
  value: string | number | Date | undefined | null
}

const convertDocument = <T>(
  doc: FirebaseFirestore.DocumentSnapshot
): Document<T> => {
  return {
    id: doc.id,
    ref: doc.ref,
    exists: doc.exists,
    data: (): T => {
      if (!doc.exists) {
        throw Error('data not found.')
      }
      return ({ ...doc.data(), id: doc.id } as unknown) as T
    },
  }
}

export const findDoc = async <T>(path: string): Promise<Document<T>> => {
  return convertDocument<T>(await db.doc(path).get())
}
