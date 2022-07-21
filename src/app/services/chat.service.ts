import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators'

export interface User {
  uid: string;
  email: string;
}

export interface Message {
  createdAt: any;
  id: string;
  from: string;
  fromName: string;
  msg: string;
  myMsg: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  currentUser: User = null;

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.afAuth.onAuthStateChanged( user => {
      console.log('Changed: ', user);
      this.currentUser = user;
    })
   }

   async signUp({email, password}) {
     const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
     console.log('results: ', credential);
     const uid = credential.user.uid;

     return this.afs.doc(
      `users/${uid}`
     ).set({
      uid,
      email: credential.user.email
     });
   }

   signIn({email, password}) {
     return this.afAuth.signInWithEmailAndPassword(email, password);
   }

   async signOut() {
      return this.afAuth.signOut();
   }

   /* chats */

   addChatMessage(msg){
    return this.afs.collection('messages').add({
       msg: msg,
       from: this.currentUser.uid,
       createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
   }

   getChatMessages(){
    let users = [];
    return this.getUsers().pipe(
      switchMap( res => {
        users = res;
        console.log('all users: ', users);
        return this.afs.collection('messages', ref => ref.orderBy('createdAt')).valueChanges({ idField: 'id' }) as Observable<Message[]>
      }),
      map(messages => {
        for (let m of messages){
          m.fromName = this.getUserForMsg(m.from, users);
          m.myMsg = this.currentUser.uid === m.from;
        }
        console.log('all messages: ', messages);
        return messages;
      })
    )
   }

   getUsers(){
    return this.afs.collection('users').valueChanges({ idField: 'uid' }) as Observable<User[]>;
   }

   getUserForMsg(msgFronId, users:User[]){
    for (let usr of users) {
      if (usr.uid === msgFronId) {
        return usr.email;
      }
    }
    return 'Deleted';
   }

}
