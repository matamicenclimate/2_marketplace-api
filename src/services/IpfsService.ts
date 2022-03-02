import { Service } from 'typedi'
import fs from 'fs'
import { NFTStorage, File} from 'nft.storage'
import { IpfsRequestData } from '../interfaces'

const endpoint = 'https://api.nft.storage' // the default
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDc4NjNlZDFkYzg2MUMxOEQxMURmNzcyQkZFQjMwMUIyMGNCOGI2MkUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY0NjIwNzgxMzkwMiwibmFtZSI6ImNsaW1hdGUtbmZ0LW1hcmtldHBsYWNlLWRldiJ9.QdgmfBeIcXzmF91e1FVsprrD1TQEhL7vBuQ-tAVG2Gk'

export type NFTMetadata = {
	name: string
	description: string
	image: string
	properties: {
			file: {
					name: string
					type: string
					size: number
			}
			artist: string
	}
}

function getFileMetadata(file, title, author, description): NFTMetadata {
	return {
		name: title,
		description,
		image: '',
		properties: {
			file: {
				name: file.originalname,
				type: file.mimetype,
				size: file.size
			},
			artist: author
		}
	}
}

@Service()
export default class IpfsService {
  async execute(data: IpfsRequestData, file: File) {
	const storage = new NFTStorage({ token })
	console.log('------- ', storage)
	const {
		title,
		author,
		description
	} = data

	const metadata: NFTMetadata = getFileMetadata(file, title, author, description)
	const result: any = await storage.store({
    name: 'Pinpie',
    description: 'Pin is not delicious beef!',
    image: new File(
      [
        await fs.promises.readFile('/Users/sergio/Documents/workspace/deka/climate-nft-marketplace-api/test/testSupport/ipfs.png')
      ],
      '/Users/sergio/Documents/workspace/deka/climate-nft-marketplace-api/test/testSupport/ipfs.png',
      { type: 'image/png' }
    ),
  })
	.catch(error => {
		console.log(error.message)
		console.log(error.stack)
	})

  console.log('IPFS URL for the metadata:', result.url)
  console.log('metadata.json contents:\n', result.data)
  console.log(
    'metadata.json contents with IPFS gateway URLs:\n',
    result.embed()
  )
		return {
      status: 'ok'
    }
  }
}
