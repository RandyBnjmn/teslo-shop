import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces/JwtPayload.interface';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() webSocketServer: Server
  constructor(private readonly messagesWsService: MessagesWsService, private JwtService: JwtService) { }


  async handleConnection(client: Socket) {
    console.log(client);
    const token = client.handshake.headers.authentication as string;
    console.log({ token });

    let jwtPayload: JwtPayload;

    try {
      jwtPayload = this.JwtService.verify(token);
      await this.messagesWsService.registerClient(client, jwtPayload.id);

    } catch (error) {
      client.disconnect()
      return;
    }




    console.log({ conectados: this.messagesWsService.getConnectedClients() });


    this.webSocketServer.emit("clients-update", this.messagesWsService.getConnectedClients())
    // console.log("Cliente conectado", client.id);
  }

  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id)
    this.webSocketServer.emit("clients-update", this.messagesWsService.getConnectedClients())
    // console.log("Cliente desconectado", client.id);
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {

    // console.log({ client, payload });

    // Emitir solo al cliente
    // client.emit('message-from-server',
    //   { fullName: "Yo", message: payload.message || "No message" }
    // )

    // Emitir a todos menos al cliente inicial

    // client.broadcast.emit('message-from-server',
    //   { fullName: "Yo", message: payload.message || "No message" }
    // )
    this.webSocketServer.emit('message-from-server',
      { fullName: this.messagesWsService.getUserFullName(client.id), message: payload.message || "No message" }
    )





  }




}
