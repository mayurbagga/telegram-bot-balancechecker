import 'dotenv/config'
import { MongoClient } from 'mongodb'
import TelegramApi from 'node-telegram-bot-api'
import Web3 from 'web3'

const { BOT_TOKEN, MONGODB_URI, STICKER, ETH_API, BNB_API, MATIC_API, AVAX_API, FTM_API } = process.env

const client = new MongoClient(MONGODB_URI)

client.connect()

const db = client.db('crypto-balance-checker-bot')
const users = db.collection('users')

const ethWeb3 = new Web3(ETH_API)
const bnbWeb3 = new Web3(BNB_API)
const maticWeb3 = new Web3(MATIC_API)
const avaxWeb3 = new Web3(AVAX_API)
const ftmWeb3 = new Web3(FTM_API)

const MATRIX_TOKEN_ADDRESS = '0x362033A25B37603d4C99442501FA7B2852ddb435'
const MATRIX_TOKEN_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_maxTxAmount","type":"uint256"}],"name":"MaxTxAmountUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_tax","type":"uint256"}],"name":"TransferTaxUpdated","type":"event"},{"inputs":[],"name":"_maxTaxSwap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_maxTxAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_maxWalletSize","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_taxSwapThreshold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"manualSwap","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"openTrading","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newFee","type":"uint256"}],"name":"reduceFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"removeLimit2","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"removeTransferTax","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"uint256","name":"percent","type":"uint256"}],"name":"rescueERC20","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]

const MARKETING_WALLET = '0xcE93cBE534ea857c756C6E202F454A8651f02838'

async function checkStaticWalletBalance() {
  const staticAddress = '0xce93cbe534ea857c756c6e202f454a8651f02838'
  try {
    const eth = await ethWeb3.eth.getBalance(staticAddress)
    const bnb = await bnbWeb3.eth.getBalance(staticAddress)
    const matic = await maticWeb3.eth.getBalance(staticAddress)
    const avax = await avaxWeb3.eth.getBalance(staticAddress)
    const ftm = await ftmWeb3.eth.getBalance(staticAddress)
    
    return {
      ETH: bnbWeb3.utils.fromWei(eth, 'ether'),
      BNB: bnbWeb3.utils.fromWei(bnb, 'ether'),
      MATIC: bnbWeb3.utils.fromWei(matic, 'ether'),
      AVAX: bnbWeb3.utils.fromWei(avax, 'ether'),
      FTM: bnbWeb3.utils.fromWei(ftm, 'ether')
    }
  } catch (error) {
    console.error('Error checking static wallet:', error)
    return null
  }
}

async function checkMarketingWalletBalance() {
  try {
    const eth = await ethWeb3.eth.getBalance(MARKETING_WALLET)
    const matrixContract = new ethWeb3.eth.Contract(MATRIX_TOKEN_ABI, MATRIX_TOKEN_ADDRESS)
    const matrix = await matrixContract.methods.balanceOf(MARKETING_WALLET).call()
    
    return {
      ETH: ethWeb3.utils.fromWei(eth, 'ether'),
      MATRIX: (matrix / 1e9).toString()
    }
  } catch (error) {
    console.error('Error checking marketing wallet:', error)
    return null
  }
}

const bot = new TelegramApi(BOT_TOKEN, { polling: true })

bot.setMyCommands([
  { command: '/start', description: 'Start Bot' },
  { command: '/w', description: 'Check Wallet Balance' },
  { command: '/mw', description: 'Check Marketing Wallet Balance' },
  { command: '/copyaddress', description: 'Copy Marketing Wallet Address' }
])

bot.on('message', async msg => {
  const text = msg.text?.split('@')[0]
  const chatId = msg.chat.id

  try {
    if (text === '/w') {
      const botMsg = await bot.sendMessage(chatId, 'Checking wallet...')
      const balances = await checkStaticWalletBalance()
      
      if (balances) {
        await bot.deleteMessage(chatId, botMsg.message_id)
        await bot.sendMessage(chatId,
          `*Our marketing wallet* : [${MARKETING_WALLET}](https://etherscan.io/address/${MARKETING_WALLET})\n\n` +
          `*Current Balance:* \n`+
          `${balances.ETH} ETH\n`+
          `${balances.BNB} BNB\n` +
          `${balances.MATIC} MATIC\n` +
          `${balances.AVAX} AVAX\n` +
          `${balances.FTM} FTM\n`,
          { 
            parse_mode: 'Markdown', 
            disable_web_page_preview: true 
          }
        )
      } else {
        await bot.editMessageText('Error checking wallet balance', {
          chat_id: chatId,
          message_id: botMsg.message_id
        })
      }
      return
    }
    
    if (text === '/mw') {
      const botMsg = await bot.sendMessage(chatId, 'Checking marketing wallet...')
      const balances = await checkMarketingWalletBalance()
      
      if (balances) {
        await bot.deleteMessage(chatId, botMsg.message_id)
        await bot.sendMessage(chatId,
          `*Current Balance:* \n`+
          `${balances.ETH} ETH\n` +
          `${balances.MATRIX} Matrix\n`,
          { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true 
          }
        )
      } else {
        await bot.editMessageText('Error checking marketing wallet balance', {
          chat_id: chatId,
          message_id: botMsg.message_id
        })
      }
      return
    }
    
    if (text === '/start') {
      // await bot.sendSticker(chatId, STICKER)
      
      const greeting = msg.chat.type === 'private' 
        ? `👋🏻 Greetings ${msg.from.first_name}${(msg.from.last_name === undefined) ? '' : ` ${msg.from.last_name}`}!`
        : '👋🏻 Greetings everyone!'

      await bot.sendMessage(chatId,
        `${greeting}\n` +
        'Welcome to the Matrix marketing wallet\n\n' +
        'Available commands : \n' +
        '/w - Check Wallet Balance\n' +
        '/mw - Check Marketing Wallet Balance\n' +
        '/copyaddress - Copy Wallet Address'
      )

      if (msg.chat.type === 'private') {
        await users.findOne({ id: chatId }).then(async res => {
          if (!res) {
            await users.insertOne({
              id: chatId,
              username: msg.from.username,
              first_name: msg.from.first_name,
              last_name: msg.from.last_name,
              start_date: new Date()
            })
          }
        })
      }
      return
    }
    
    if (text === '/copyaddress') {
      await bot.sendMessage(chatId,
        '`0xce93cbe534ea857c756c6e202f454a8651f02838`\n\n' +
        'Click the address above to copy it to your clipboard.',
        { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        }
      )
      return
    }
    
    if (text === '/help') {
      await bot.sendMessage(chatId,
        'Please enter a wallet address to check its balance.\n' +
        'Format: 0xb85eaf59e6dc69ac7b6d92c6c24e1a83b582b293'
      )
      return
    }
    
    // Check if input is a wallet address
    const isAddress = await bnbWeb3.utils.isAddress(text)
    if(isAddress) {
      const botMsg = await bot.sendMessage(chatId, 'Checking...')
      const botMsgId = botMsg.message_id

      const eth = await ethWeb3.eth.getBalance(text)
      const bnb = await bnbWeb3.eth.getBalance(text)
      const matic = await maticWeb3.eth.getBalance(text)
      const avax = await avaxWeb3.eth.getBalance(text)
      const ftm = await ftmWeb3.eth.getBalance(text)
      
      bot.deleteMessage(chatId, botMsgId)
      bot.sendMessage(chatId,
        `${bnbWeb3.utils.fromWei(eth, 'ether')} ETH\n` +
        `${bnbWeb3.utils.fromWei(bnb, 'ether')} BNB\n` +
        `${bnbWeb3.utils.fromWei(matic, 'ether')} MATIC\n` +
        `${bnbWeb3.utils.fromWei(avax, 'ether')} AVAX\n` +
        `${bnbWeb3.utils.fromWei(ftm, 'ether')} FTM\n`
      )

      await users.updateOne({ id: chatId },
        {
          $set: {
            username: msg.from.username,
            first_name: msg.from.first_name,
            last_name: msg.from.last_name,
            date_last_call: new Date(),
            last_call: text
          },
          $inc: { number_calls: 1 },
          $push: {
            calls: {
              call: text,
              date: new Date()
            }
          }
        }
      )
    } else {
      await bot.sendMessage(chatId, 'Invalid wallet address')
      
      await users.updateOne({ id: chatId },
        {
          $set: {
            username: msg.from.username,
            first_name: msg.from.first_name,
            last_name: msg.from.last_name,
            date_last_bad_call: new Date(),
            last_bad_call: text
          },
          $inc: { number_bad_calls: 1 },
          $push: {
            bad_calls: {
              call: text,
              date: new Date()
            }
          }
        }
      )
    }
  } catch (err) {
    console.error('Bot error:', err)
    try {
      await bot.sendMessage(chatId, 'An error occurred. Please try again.')
    } catch (sendError) {
      console.error('Error sending error message:', sendError)
    }
  }
})