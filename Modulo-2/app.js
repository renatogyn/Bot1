const builder = require('botbuilder')
const restify = require('restify')
const cognitiveService = require('botbuilder-cognitiveservices')


const server = restify.createServer()
const port = process.env.port || 3978

server.listen(port, () => {
    console.log(`Server rodando em ${server.url}`)

})

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
})

server.post('/api/messages', connector.listen())

// QnaMaker Dialog

const bot = new builder.UniversalBot(connector)
    bot.set('storage', new builder.MemoryBotStorage())

const recognizer = new cognitiveService.QnAMakerRecognizer({
    knowledgeBaseId: 'c60c2e44-6543-4b74-96e2-8f487ca68055',
    subscriptionKey: 'eca18c68ffb0456da185cd2bbab98d9e',
    top: 3
})

const qnaMakerTools = new cognitiveService.QnAMakerTools()
    bot.library(qnaMakerTools.createLibrary())

const qnaMakerDialog = new cognitiveService.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'Desculpe, não entendi, ainda estou aprendendo, reformule sua pergunta, por favor.',
    qnaThreshold: 0.5,
    feedbackLib: qnaMakerTools
})

qnaMakerDialog.respondFromQnAMakerResult = (session, result) => {
    const primeira = result.answers[0].answer
    const opcao = primeira.split(';')
    if(opcao.length === 1)
        return session.send(primeira)

    const [titulo, descricao, url, imagem] = opcao

    const card = new builder.HeroCard(session)
                        .title(titulo)
                        .text(descricao)
                        .images([
                            builder.CardImage.create(session, imagem.trim())
                        ])
                        .buttons([
                            builder.CardAction.openUrl(session, url.trim(), 'Comprar')
                        ])
                
    const resposta = new builder.Message(session).addAttachment(card)
    session.send(resposta)                    
}

bot.dialog('/', qnaMakerDialog)

