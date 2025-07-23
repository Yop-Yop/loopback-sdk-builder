/* tslint:disable */
declare var Object: any;
import { Injectable, Inject } from '@angular/core';
import { InternalStorage } from '../../storage/storage.swaps';
import { SDKToken } from '../../models/BaseModels';
/**
* @author Jonathan Casarrubias <twitter:@johncasarrubias> <github:@mean-expert-official>
* @module SocketConnection
* @license MIT
* @description
* This module handle socket connections and return singleton instances for each
* connection, it will use the SDK Socket Driver Available currently supporting
* Angular 2 for web, NativeScript 2 and Angular Universal.
**/
@Injectable()
export class LoopBackAuth {
  /**
   * @type {SDKToken}
   **/
  private token: SDKToken = new SDKToken();
  /**
   * @type {string}
   **/
  protected prefix: string = '$LoopBackSDK$';
  /**
   * @method constructor
   * @param {InternalStorage} storage Internal Storage Driver
   * @description
   * The constructor will initialize the token loading data from storage
   **/
  constructor(@Inject(InternalStorage) protected storage: InternalStorage) {
    this.refreshTokenFromStorage();
  }

  private refreshTokenFromStorage(): void {
    const storedToken = {
      id: this.load('id'),
      user: this.load('user'),
      userId: this.load('userId'),
      created: this.load('created'),
      ttl: this.load('ttl'),
      scopes: this.load('scopes'),
      rememberMe: this.load('rememberMe')
    };

    this.token = Object.values(storedToken).some((value: null) => value !== null)
        ? storedToken
        : new SDKToken();
  }
  /**
   * @method setRememberMe
   * @param {boolean} value Flag to remember credentials
   * @return {void}
   * @description
   * This method will set a flag in order to remember the current credentials
   **/
  public setRememberMe(value: boolean): void {
    this.token.rememberMe = value;
  }
  /**
   * @method setUser
   * @param {any} user Any type of user model
   * @return {void}
   * @description
   * This method will update the user information and persist it if the
   * rememberMe flag is set.
   **/
  public setUser(user: any) {
    this.token.user = user;
    this.save();
  }
  /**
   * @method setToken
   * @param {SDKToken} token SDKToken or casted AccessToken instance
   * @return {void}
   * @description
   * This method will set a flag in order to remember the current credentials
   **/
  public setToken(token: SDKToken): void {
    // Clear existing token first
    this.clear();

    // Set new token
    this.token = JSON.parse(JSON.stringify(token));

    // Persist to storage
    this.save();

    // Refresh from storage to ensure consistency
    this.refreshTokenFromStorage();
  }
  /**
   * @method getToken
   * @return {void}
   * @description
   * This method will set a flag in order to remember the current credentials.
   **/
  public getToken(): SDKToken {
    return <SDKToken>this.token;
  }
  /**
   * @method getAccessTokenId
   * @return {string}
   * @description
   * This method will return the actual token string, not the object instance.
   **/
  public getAccessTokenId(): string {
    // Always refresh from storage first
    this.refreshTokenFromStorage();
    return this.token?.id || null;
  }
  /**
   * @method getCurrentUserId
   * @return {any}
   * @description
   * This method will return the current user id, it can be number or string.
   **/
  public getCurrentUserId(): any {
    return this.token.userId;
  }
  /**
   * @method getCurrentUserData
   * @return {any}
   * @description
   * This method will return the current user instance.
   **/
  public getCurrentUserData(): any {
    return (typeof this.token.user === 'string') ? JSON.parse(this.token.user) : this.token.user;
  }
  /**
   * @method save
   * @return {boolean} Whether or not the information was saved
   * @description
   * This method will save in either local storage or cookies the current credentials.
   * But only if rememberMe is enabled.
   **/
  public save(): boolean {
    let today = new Date();
    let expires = new Date(today.getTime() + (((this.token.ttl) ? this.token.ttl : (60 * 60 * 24)) * 1000));

    try {
      this.persist('id', this.token.id, expires);
      this.persist('user', this.token.user, expires);
      this.persist('userId', this.token.userId, expires);
      this.persist('created', this.token.created, expires);
      this.persist('ttl', this.token.ttl, expires);
      this.persist('rememberMe', this.token.rememberMe, expires);
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }
  /**
   * @method load
   * @param {string} prop Property name
   * @return {any} Any information persisted in storage
   * @description
   * This method will load either from local storage or cookies the provided property.
   **/
  protected load(prop: string): any {
    return this.storage.get(`${this.prefix}${prop}`);
  }
  /**
   * @method clear
   * @return {void}
   * @description
   * This method will clear cookies or the local storage.
   **/
  public clear(): void {
    Object.keys(this.token).forEach((prop: string) => {
      this.storage.remove(`${this.prefix}${prop}`);
    });
    this.token = new SDKToken();
  }
  /**
   * @method persist
   * @return {void}
   * @description
   * This method saves values to storage
   **/
  protected persist(prop: string, value: any, expires?: Date): void {
    try {
      this.storage.set(
          `${this.prefix}${prop}`,
          (typeof value === 'object') ? JSON.stringify(value) : value,
          this.token.rememberMe?expires:null
      );
    }
    catch (err) {
      console.error('Cannot access local/session storage:', err);
    }
  }
}

