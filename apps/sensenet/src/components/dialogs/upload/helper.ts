import { WebKitDirectoryEntry, WebKitDirectoryReader, WebKitEntry, WebKitFileEntry } from '@sensenet/client-core'

/**
 * Wrap readEntries in a promise to make working with readEntries easier
 * readEntries will return only some of the entries in a directory
 * e.g. Chrome returns at most 100 entries at a time
 */
async function readEntriesPromise(directoryReader: WebKitDirectoryReader): Promise<WebKitEntry[] | undefined> {
  try {
    return await new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })
  } catch (err) {
    console.log(err)
  }
}

/**
 * Get all the entries (files or sub-directories) in a directory
 * by calling readEntries until it returns empty array
 */
async function readAllDirectoryEntries(directoryReader: WebKitDirectoryReader) {
  const entries = []
  let readEntries = await readEntriesPromise(directoryReader)
  while (readEntries && readEntries.length > 0) {
    entries.push(...readEntries)
    readEntries = await readEntriesPromise(directoryReader)
  }
  return entries
}

/**
 * Drop handler function to get all files
 */
export async function getAllFileEntries(dataTransferItemList: DataTransferItemList): Promise<WebKitFileEntry[]> {
  const fileEntries = []
  // Use BFS to traverse entire directory/file structure
  const queue: WebKitEntry[] = []
  // Unfortunately dataTransferItemList is not iterable i.e. no forEach
  for (let i = 0; i < dataTransferItemList.length; i++) {
    queue.push(dataTransferItemList[i].webkitGetAsEntry())
  }
  while (queue.length > 0) {
    const entry = queue.shift()
    if (entry && entry.isFile) {
      fileEntries.push(entry)
    } else if (entry && entry.isDirectory) {
      queue.push(...(await readAllDirectoryEntries((entry as WebKitDirectoryEntry).createReader())))
    }
  }
  return fileEntries as WebKitFileEntry[]
}

export type FileWithFullPath = File & { fullPath?: string }
