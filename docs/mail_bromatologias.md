# Pedidos a Bromatologias Municipales

Las plantas chicas y panaderias industriales con habilitacion solo municipal NO aparecen en SIFEGA. Para capturarlas hay que pedir el listado a cada Direccion de Bromatologia. La Ley 27.275 de Acceso a la Informacion Publica obliga al organismo a responder en 15 dias habiles.

---

## Contactos por municipio

### Pilar
- **Direccion**: Direccion de Bromatologia - Municipalidad de Pilar
- **Mail**: bromatologia@pilar.gov.ar (verificar - puede estar bajo Salud o Industria)
- **Mesa de entradas**: tramites@pilar.gov.ar
- **Web**: https://www.pilar.gov.ar
- **Backup**: presentar nota fisica en Mesa de Entradas - Edificio Municipal, Rivadavia 660, Pilar

### Escobar
- **Direccion**: Direccion de Bromatologia y Zoonosis - Municipalidad de Escobar
- **Mail**: tramites@escobar.gov.ar
- **Web**: https://escobar.gob.ar
- **Backup**: Edificio Municipal, Estrada 599, Belen de Escobar

### General Rodriguez
- **Direccion**: Direccion de Bromatologia - Municipalidad de General Rodriguez
- **Mail**: mesadeentradas@gralrodriguez.gob.ar
- **Web**: https://www.gralrodriguez.gob.ar
- **Backup**: Edificio Municipal, 25 de Mayo 2202, Gral. Rodriguez

### Lujan
- **Direccion**: Direccion de Bromatologia - Municipalidad de Lujan
- **Mail**: mesadeentradas@lujan.gov.ar
- **Web**: https://www.lujan.gob.ar
- **Backup**: Edificio Municipal, San Martin 550, Lujan

> ANTES DE MANDAR: confirmar mails en la web de cada municipio. Las direcciones cambian. Si el mail rebota, hacer la presentacion fisica en Mesa de Entradas - es mas efectiva igual porque queda numero de expediente.

---

## Template de mail

**Asunto**: Solicitud de informacion publica - Ley 27.275 - Listado de establecimientos elaboradores de alimentos habilitados

---

Sr./Sra. Director/a de Bromatologia
Municipalidad de [PILAR / ESCOBAR / GENERAL RODRIGUEZ / LUJAN]
S / D

De mi mayor consideracion:

Por la presente, en mi caracter de [persona humana / representante legal de XXX SAS] y en ejercicio del derecho de acceso a la informacion publica consagrado en la Ley 27.275 y normas concordantes, me dirijo a Ud. a efectos de solicitar la siguiente informacion en formato digital (preferentemente CSV o XLSX):

**Listado de establecimientos elaboradores de alimentos con habilitacion municipal vigente o de baja en los ultimos 5 anios** dentro del partido de [PILAR / ESCOBAR / GENERAL RODRIGUEZ / LUJAN], con los siguientes datos por establecimiento:

1. Razon social y/o nombre de fantasia
2. CUIT
3. Domicilio del establecimiento (calle, numero, localidad, codigo postal)
4. Rubro o actividad habilitada
5. Numero de habilitacion municipal y/o RPE (Registro Provincial de Establecimiento)
6. Estado de la habilitacion (vigente, suspendida, dada de baja)
7. Fecha de alta y, en su caso, fecha de baja

El objeto de la solicitud es la realizacion de un relevamiento de la oferta industrial alimentaria del corredor noroeste del Gran Buenos Aires, con fines de analisis comercial y de inversion privada. La informacion sera tratada conforme a la normativa vigente de proteccion de datos personales.

Conforme al articulo 11 de la Ley 27.275, solicito que la respuesta sea remitida al correo electronico [TU EMAIL] dentro del plazo de 15 (quince) dias habiles.

Sin otro particular, saluda atentamente.

[NOMBRE COMPLETO]
DNI: [XX.XXX.XXX]
Domicilio: [DOMICILIO]
Email: [EMAIL]
Telefono: [TELEFONO]

---

## Tips practicos

1. **Mandalo lunes a primera hora.** Los expedientes de mesa de entradas tienen mejor seguimiento si entran a principio de semana.

2. **Pedi numero de expediente.** Si entregas en mesa de entradas fisica, te dan un numero. Anotalo. Si haces por mail, pediselo en la respuesta automatica.

3. **Si no responden en 15 dias habiles**, mandar reclamo formal al titular del area y CC al Intendente. Si pasan 30 dias, podes elevar denuncia a la Agencia de Acceso a la Informacion Publica (AAIP).

4. **Hace seguimiento telefonico al dia 7-8.** "Hola, mande un pedido por Ley 27.275, queria saber si lo tienen en proceso" - generalmente responden mejor con el push.

5. **Aprovecha la reunion para pedir mas.** Cuando vayas a retirar la respuesta o a una reunion en Bromatologia, preguntales informalmente:
   - Que establecimientos cerraron en los ultimos 2 anios
   - Cuales tienen problemas recurrentes de habilitacion
   - Quien dejo de venir a renovar
   
   Esa informacion **no esta en ningun listado** y vale oro. La gente de Bromatologia lleva 15-20 anos en el puesto y se conoce a todos los duenos.

6. **Para Pilar**, hace el doble juego: pedi a Bromatologia + a la Secretaria de Produccion / Desarrollo Economico. La segunda tiene la lista de empresas radicadas en parques industriales y es mas comercial / menos burocratica.

---

## Mapeo cruzado: cuando llegan las respuestas

Cargar las 4 listas en la tabla `establecimientos_municipales` (campo `partido` y `fuente`). Despues correr:

```sql
-- Empresas que tienen RNE municipal pero NO RNE nacional
-- = candidatos a "subir" a tránsito federal con tu inversion
select m.razon_social, m.cuit, m.domicilio, m.rubro, m.partido
from establecimientos_municipales m
left join establecimientos_sifega s on s.cuit = m.cuit
where s.cuit is null
  and m.estado = 'vigente'
order by m.partido;

-- Empresas con RNE municipal en estado de baja reciente = posible distress
select * from establecimientos_municipales
where estado in ('baja', 'suspendida', 'dada de baja')
  and fecha_baja > current_date - interval '24 months'
order by fecha_baja desc;
```
