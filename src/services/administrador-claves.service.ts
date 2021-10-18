import { /* inject, */ BindingScope, injectable} from '@loopback/core';
const generator = require('generate-password');

var CryptoJS = require("crypto-js");

@injectable({scope: BindingScope.TRANSIENT})
export class AdministradorClavesService {
  constructor(/* Add @inject to inject parameters */) {}

  /*
   * Add service methods here
   */

  CrearClaveAleatoria(): string{

    let password = generator.generate({
      length: 8,
      numbers: true,
      uppercase: true
    });
    return password
  }

  CifrarTexto(texto: string){
    let textoCifrado =  CryptoJS.MD5(texto).toString()
    return textoCifrado

  }
}
