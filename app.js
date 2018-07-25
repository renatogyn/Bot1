// load env variables from the .env file
require('dotenv-extended').load()

const builder = require('botbuilder')
const restify = require('restify')
const cognitiveServices = require('botbuilder-cognitiveservices')
const brazilianTools = require('./tools/brazilianQnaMakerTools')


//=========================================================
// Bot Setup
//=========================================================

const port = process.env.port || process.env.PORT || 3978
const server = restify.createServer()
server.listen(port, () => {
    console.log(`${server.name} listening to ${server.url}`)
})

const connector = new builder.ChatConnector({
  //MICROSOFT_APP_ID: process.env.MICROSOFT_APP_ID,
  //MICROSOFT_APP_PASSWORD: process.env.MICROSOFT_APP_PASSWORD
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
})

const bot = new builder.UniversalBot(connector)
bot.set('storage', new builder.MemoryBotStorage())
server.post('/api/messages', connector.listen())

//=========================================================
// Bots Dialogs
//=========================================================

const recognizer = new cognitiveServices.QnAMakerRecognizer({
  knowledgeBaseId: process.env.QNA_KNOWLEDGE_BASE_ID,
  authKey: process.env.QNA_SUBSCRIPTION_KEY,
  top: 3
})

const brazilianQnaMakerTools = new brazilianTools.BrazilianQnaMakerTools()
bot.library(brazilianQnaMakerTools.createLibrary())

const basicQnaMakerDialog = new cognitiveServices.QnAMakerDialog({
  recognizers: [recognizer],
  defaultMessage: 'Desculpe, eu não entendi. Ainda estou aprendendo, por favor reformule sua pergunta.',
  qnaThreshold: 0.5,
  feedbackLib: brazilianQnaMakerTools
})

//=========================================================
// Cards em resposta do QNA
//=========================================================

basicQnaMakerDialog.respondFromQnAMakerResult = (session, qnaMakerResult) => {
    const firstAnswer = qnaMakerResult.answers[0].answer
    const composedAnswer = firstAnswer.split(';')
    if (composedAnswer.length === 1) {
    return session.send(firstAnswer)
    }
    const [title, description, url, image] = composedAnswer
    const card = new builder.HeroCard(session)
        .title(title)
        .text(description)
        .images([builder.CardImage.create(session, image.trim())])
        .buttons([builder.CardAction.openUrl(session, url.trim(), 'Acessar')])
    const reply = new builder.Message(session).addAttachment(card)
    session.send(reply)
}

bot.dialog('/', basicQnaMakerDialog)