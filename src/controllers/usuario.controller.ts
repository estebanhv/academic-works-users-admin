import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {Configuracion} from '../key/configuracion';
import {CambioClave, NotificacionCorreo, Usuario} from '../models';
import {CredencialesRecuperarClave} from '../models/credenciales-recuperar-clave.model';
import {NotificacionSms} from '../models/notificacion-sms.model';
import {UsuarioRepository} from '../repositories';
import {AdministradorClavesService, NotificacionesService, SesionUsuariosService} from '../services';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(AdministradorClavesService)
    public servicioClaves: AdministradorClavesService,
    @service(SesionUsuariosService)
    private servicioSesionUsuario: SesionUsuariosService,
    @service(NotificacionesService)
    private notificacionesService: NotificacionesService
  ) { }

  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['_id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, '_id'>,
  ): Promise<Usuario> {
    let clave = this.servicioClaves.CrearClaveAleatoria()
    console.log(clave)
    //Enviar clave por correo electronico
    let claveCifrada = this.servicioClaves.CifrarTexto(clave)
    usuario.clave = claveCifrada

    let usuarioListo = await this.usuarioRepository.create(usuario);
    if (usuarioListo) {
      let datos = new NotificacionCorreo()
      datos.destinatario = usuario.correo
      datos.asunto = Configuracion.asuntoCreacionUsuario
      datos.mensaje = `Hola ${usuario.nombre} <br/>${Configuracion.mensajeCreacionUsuario} ${clave}`
      this.notificacionesService.EnviarCorreo(datos)
      //Enviar clave por correo electronico
    }
    return usuarioListo
  }

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }

  /*Metodos que de adiccionan*
   *
   *
   */


  /*
    @post('/reconocer-usuario')
    @response(200, {
      description: 'Reconocer los usuarios',
      content: {'application/json': {schema: getModelSchemaRef(Credenciales)}},
    })
    async reconocerUsuario(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Credenciales, {
              title: 'Identificar Usuario'
            }),
          },
        },
      })
      credenciales: Credenciales,
    ): Promise<object | null> {
      let usuario= await this.servicioSesionUsuario.IdentificarUsuario(credenciales)

      if (usuario) {
        usuario.clave=""
        //Generar token y añadirlo a la respuesta
      }
      return usuario

    }
  */





  @post('/cambiar-clave')
  @response(200, {
    description: 'Reconocer los usuarios',
    content: {'application/json': {schema: getModelSchemaRef(CambioClave)}},
  })
  async cambiarClave(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CambioClave, {
            title: 'Cambiar clave'
          }),
        },
      },
    })
    credencialesClave: CambioClave,
  ): Promise<Boolean> {
    let usuario = await this.servicioClaves.CambiarClave(credencialesClave)
    if (usuario) {
      let datos = new NotificacionCorreo()
      datos.destinatario = usuario.correo
      datos.asunto = Configuracion.asuntoCambioClave
      datos.mensaje = `Hola ${usuario.nombre} <br/>${Configuracion.mensajeCambioClave}`
      this.notificacionesService.EnviarCorreo(datos)
      //Invocar al servicio de notificaciones para enviar correo al usuario

    }


    return usuario != null

  }


  @post('/recuperar-clave')
  @response(200, {
    description: 'Recuperar clave de los usuarios',
    content: {'application/json': {schema: {}}},
  })
  async recuperarClave(
    @requestBody({
      content: {
        'application/json': {
        },
      },
    })
    credenciales: CredencialesRecuperarClave,
  ): Promise<Usuario | null> {
    let usuario = await this.usuarioRepository.findOne({
      where: {

        correo: credenciales.correo
      }
    })
    if (usuario) {
      let clave = this.servicioClaves.CrearClaveAleatoria()
      usuario.clave = this.servicioClaves.CifrarTexto(clave)
      await this.usuarioRepository.updateById(usuario._id, usuario);

      let datos = new NotificacionSms()
      datos.destino = usuario.celular
      datos.mensaje = Configuracion.asuntoCambioClave
      datos.mensaje = `Hola ${usuario.nombre} <br/>${Configuracion.mensajeRecuperarClave} ${clave}`



      this.notificacionesService.EnviarSms(datos)
    }


    return usuario

  }


}
