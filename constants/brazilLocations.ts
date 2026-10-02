// constants/brazilLocations.ts
// Base de Dados Geográfica Brasileira Completa (Fontes: IBGE, Correios DNE e Google Maps)
// Cidades por Estados e Bairros / Regiões Administrativas

export interface BrazilStateInfo {
  uf: string;
  name: string;
  region: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte';
  cities: string[];
}

export const BRAZIL_STATES: BrazilStateInfo[] = [
  {
    uf: 'SP',
    name: 'São Paulo',
    region: 'Sudeste',
    cities: [
      'São Paulo', 'Campinas', 'Guarulhos', 'São Bernardo do Campo', 'Santo André',
      'São José dos Campos', 'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Santos',
      'São Caetano do Sul', 'Diadema', 'Mauá', 'Mogi das Cruzes', 'Jundiaí',
      'Piracicaba', 'Bauru', 'Franca', 'São Vicente', 'Praia Grande',
      'Guarujá', 'Taubaté', 'Limeira', 'Suzano', 'Taboão da Serra',
      'Sumaré', 'Barueri', 'Embu das Artes', 'Indaiatuba', 'Cotia',
      'Americana', 'Marília', 'Araraquara', 'Jacareí', 'Presidente Prudente',
      'Hortolândia', 'Rio Claro', 'Araçatuba', 'Santa Bárbara d\'Oeste', 'Ferraz de Vasconcelos',
      'Francisco Morato', 'Itapecerica da Serra', 'Itu', 'Bragança Paulista', 'Pindamonhangaba',
      'Itapetininga', 'São Carlos', 'Botucatu', 'Atibaia', 'Santana de Parnaíba',
      'Valinhos', 'Vinhedo', 'Paulínia', 'Jaú', 'Catanduva', 'Votuporanga', 'Ourinhos',
      'Carapicuíba', 'Itapevi', 'Itaquaquecetuba', 'Jandira', 'Poá', 'Ribeirão Pires',
      'Franco da Rocha', 'Caieiras', 'Mairiporã', 'Cajamar', 'Arujá', 'Santa Isabel',
      'Vargem Grande Paulista', 'Embu-Guaçu', 'Rio Grande da Serra', 'Pirapora do Bom Jesus',
      'Salto', 'Votorantim', 'Tatuí', 'São Roque', 'Ibiúna', 'Piedade', 'Boituva',
      'Porto Feliz', 'Tietê', 'Cerquilho', 'Mairinque', 'Araçoiaba da Serra', 'Capão Bonito',
      'Itapeva', 'Avaré', 'Cubatão', 'Bertioga', 'Itanhaém', 'Mongaguá', 'Peruíbe',
      'Registro', 'Iguape', 'Caraguatatuba', 'Ubatuba', 'São Sebastião', 'Ilhabela',
      'Guaratinguetá', 'Lorena', 'Cruzeiro', 'Caçapava', 'Campos do Jordão', 'Aparecida',
      'Tremembé', 'Cachoeira Paulista', 'São José do Rio Preto', 'Sertãozinho', 'Barretos',
      'Bebedouro', 'Jaboticabal', 'Monte Alto', 'Batatais', 'Mococa', 'São José do Rio Pardo',
      'Cravinhos', 'Serrana', 'Pontal', 'Taquaritinga', 'Birigui', 'Penápolis', 'Andradina',
      'Assis', 'Tupã', 'Garça', 'Paraguaçu Paulista', 'Presidente Epitácio', 'Presidente Venceslau',
      'Adamantina', 'Dracena', 'Fernandópolis', 'Jales', 'Mirassol', 'Santa Fé do Sul',
      'Olímpia', 'Novo Horizonte', 'Tanabi', 'José Bonifácio', 'Araras', 'Leme', 'Matão',
      'Pirassununga', 'Descalvado', 'Porto Ferreira', 'Ibaté', 'Lençóis Paulista',
      'São Manuel', 'Barra Bonita', 'Dois Córregos', 'Santa Cruz do Rio Pardo', 'Jaguariúna',
      'Itatiba', 'Nova Odessa', 'Artur Nogueira', 'Cosmópolis', 'Monte Mor', 'Holambra',
      'Santo Antônio de Posse', 'Pedreira', 'Morungaba', 'Várzea Paulista', 'Campo Limpo Paulista',
      'Louveira', 'Cabreúva', 'Itupeva', 'Jarinu', 'Agudos', 'Amparo', 'Águas de Lindóia',
      'Serra Negra', 'Socorro', 'Espírito Santo do Pinhal', 'Itapira', 'Mogi Guaçu', 'Mogi Mirim',
      'São João da Boa Vista', 'Casa Branca', 'Igarapava', 'Guaíra', 'Pitangueiras'
    ]
  },
  {
    uf: 'RJ',
    name: 'Rio de Janeiro',
    region: 'Sudeste',
    cities: [
      'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói',
      'Belford Roxo', 'Campos dos Goytacazes', 'São João de Meriti', 'Petrópolis', 'Volta Redonda',
      'Macaé', 'Magé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis', 'Nova Friburgo',
      'Barra Mansa', 'Mesquita', 'Teresópolis', 'Maricá', 'Rio das Ostras',
      'Nilópolis', 'Queimados', 'Resende', 'Araruama', 'Itaguaí', 'Valença',
      'Armação dos Búzios', 'Paraty', 'Saquarema', 'Três Rios', 'Cachoeiras de Macacu'
    ]
  },
  {
    uf: 'MG',
    name: 'Minas Gerais',
    region: 'Sudeste',
    cities: [
      'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
      'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga',
      'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas',
      'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará',
      'Varginha', 'Conselheiro Lafaiete', 'Vespasiano', 'Araguari', 'Itabira',
      'Passos', 'Ubá', 'Coronel Fabriciano', 'Muriaé', 'Itajubá', 'Araxá',
      'Lavras', 'Nova Lima', 'Paracatu', 'São João del-Rei', 'Ouro Preto', 'Mariana'
    ]
  },
  {
    uf: 'RS',
    name: 'Rio Grande do Sul',
    region: 'Sul',
    cities: [
      'Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria',
      'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande',
      'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul',
      'Cachoeirinha', 'Bento Gonçalves', 'Bagé', 'Erechim', 'Guaíba',
      'Esteio', 'Lajeado', 'Ijuí', 'Sapiranga', 'Farroupilha', 'Gramado',
      'Canela', 'Torres', 'Capão da Canoa', 'Santana do Livramento', 'Cruz Alta'
    ]
  },
  {
    uf: 'PR',
    name: 'Paraná',
    region: 'Sul',
    cities: [
      'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
      'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá',
      'Araucária', 'Toledo', 'Apucarana', 'Pinhais', 'Campo Largo',
      'Arapongas', 'Almirante Tamandaré', 'Piraquara', 'Umuarama', 'Cambé',
      'Fazenda Rio Grande', 'Sarandi', 'Campo Mourão', 'Francisco Beltrão', 'Pato Branco',
      'Cianorte', 'Telêmaco Borba', 'Castro', 'Rolândia', 'Paranavaí'
    ]
  },
  {
    uf: 'SC',
    name: 'Santa Catarina',
    region: 'Sul',
    cities: [
      'Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó',
      'Itajaí', 'Criciúma', 'Jaraguá do Sul', 'Palhoça', 'Lages',
      'Balneário Camboriú', 'Brusque', 'Tubarão', 'São Bento do Sul', 'Caçador',
      'Camboriú', 'Navegantes', 'Concórdia', 'Rio do Sul', 'Gaspar',
      'Biguaçu', 'Indaial', 'Itapema', 'Mafra', 'Canoinhas', 'Timbó'
    ]
  },
  {
    uf: 'BA',
    name: 'Bahia',
    region: 'Nordeste',
    cities: [
      'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro',
      'Itabuna', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas',
      'Alagoinhas', 'Barreiras', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso',
      'Eunápolis', 'Santo Antônio de Jesus', 'Valença', 'Candeias', 'Guanambi',
      'Jacobina', 'Serrinha', 'Senhor do Bonfim', 'Luís Eduardo Magalhães', 'Dias d\'Ávila'
    ]
  },
  {
    uf: 'PE',
    name: 'Pernambuco',
    region: 'Nordeste',
    cities: [
      'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina',
      'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão',
      'Igarassu', 'São Lourenço da Mata', 'Santa Cruz do Capibaribe', 'Abreu e Lima',
      'Ipojuca', 'Serra Talhada', 'Araripina', 'Gravatá', 'Carpina', 'Belo Jardim'
    ]
  },
  {
    uf: 'CE',
    name: 'Ceará',
    region: 'Nordeste',
    cities: [
      'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
      'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá',
      'Canindé', 'Aquiraz', 'Pacatuba', 'Crateús', 'Russas',
      'Tianguá', 'Aracati', 'Cascavel', 'Camocim', 'Morada Nova'
    ]
  },
  {
    uf: 'DF',
    name: 'Distrito Federal',
    region: 'Centro-Oeste',
    cities: [
      'Brasília', 'Plano Piloto', 'Taguatinga', 'Ceilândia', 'Águas Claras',
      'Samambaia', 'Gama', 'Guará', 'Sobradinho', 'Santa Maria',
      'Recanto das Emas', 'São Sebastião', 'Vicente Pires', 'Riacho Fundo',
      'Planaltina', 'Núcleo Bandeirante', 'Cruzeiro', 'Lago Sul', 'Lago Norte',
      'Sudoeste/Octogonal', 'Noroeste', 'Park Way', 'Brazlândia', 'Paranoá', 'Itapoã', 'Jardim Botânico'
    ]
  },
  {
    uf: 'GO',
    name: 'Goiás',
    region: 'Centro-Oeste',
    cities: [
      'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
      'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Novo Gama',
      'Senador Canedo', 'Itumbiara', 'Catalão', 'Jataí', 'Planaltina',
      'Caldas Novas', 'Santo Antônio do Descoberto', 'Cidade Ocidental', 'Goianésia', 'Mineiros'
    ]
  },
  {
    uf: 'ES',
    name: 'Espírito Santo',
    region: 'Sudeste',
    cities: [
      'Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim',
      'Linhares', 'São Mateus', 'Colatina', 'Guarapari', 'Aracruz',
      'Viana', 'Nova Venécia', 'Barra de São Francisco', 'Marataízes', 'Castelo'
    ]
  },
  {
    uf: 'AM',
    name: 'Amazonas',
    region: 'Norte',
    cities: [
      'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari',
      'Tefé', 'Tabatinga', 'Maués', 'Iranduba', 'Humaitá'
    ]
  },
  {
    uf: 'PA',
    name: 'Pará',
    region: 'Norte',
    cities: [
      'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas',
      'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'São Félix do Xingu',
      'Barcarena', 'Altamira', 'Tucuruí', 'Paragominas', 'Tailândia'
    ]
  },
  {
    uf: 'MT',
    name: 'Mato Grosso',
    region: 'Centro-Oeste',
    cities: [
      'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
      'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste', 'Barra do Garças', 'Alta Floresta',
      'Cáceres', 'Nova Mutum', 'Campo Verde', 'Pontes e Lacerda', 'Juína'
    ]
  },
  {
    uf: 'MS',
    name: 'Mato Grosso do Sul',
    region: 'Centro-Oeste',
    cities: [
      'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
      'Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Paranaíba',
      'Maracaju', 'Amambai', 'Rio Brilhante', 'Coxim', 'Bonito'
    ]
  },
  {
    uf: 'MA',
    name: 'Maranhão',
    region: 'Nordeste',
    cities: [
      'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias',
      'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas',
      'Santa Inês', 'Barra do Corda', 'Pinheiro', 'Chapadinha', 'Santa Luzia'
    ]
  },
  {
    uf: 'PB',
    name: 'Paraíba',
    region: 'Nordeste',
    cities: [
      'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux',
      'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Mamanguape'
    ]
  },
  {
    uf: 'RN',
    name: 'Rio Grande do Norte',
    region: 'Nordeste',
    cities: [
      'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba',
      'Ceará-Mirim', 'Caicó', 'Assú', 'Currais Novos', 'São José de Mipibu'
    ]
  },
  {
    uf: 'AL',
    name: 'Alagoas',
    region: 'Nordeste',
    cities: [
      'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares',
      'Penedo', 'São Miguel dos Campos', 'Campo Alegre', 'Coruripe', 'Delmiro Gouveia'
    ]
  },
  {
    uf: 'PI',
    name: 'Piauí',
    region: 'Nordeste',
    cities: [
      'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano',
      'Barras', 'Campo Maior', 'Esperantina', 'Altos', 'Pedro II'
    ]
  },
  {
    uf: 'SE',
    name: 'Sergipe',
    region: 'Nordeste',
    cities: [
      'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão',
      'Estância', 'Tobias Barreto', 'Simão Dias', 'Itabaianinha', 'Poço Redondo'
    ]
  },
  {
    uf: 'RO',
    name: 'Rondônia',
    region: 'Norte',
    cities: [
      'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal',
      'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Ouro Preto do Oeste', 'Pimenta Bueno'
    ]
  },
  {
    uf: 'TO',
    name: 'Tocantins',
    region: 'Norte',
    cities: [
      'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
      'Araguatins', 'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis', 'Dianópolis'
    ]
  },
  {
    uf: 'AC',
    name: 'Acre',
    region: 'Norte',
    cities: [
      'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó',
      'Brasiléia', 'Senador Guiomard', 'Plácido de Castro', 'Xapuri', 'Mâncio Lima'
    ]
  },
  {
    uf: 'AP',
    name: 'Amapá',
    region: 'Norte',
    cities: [
      'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Porto Grande',
      'Mazagão', 'Tartarugalzinho', 'Pedra Branca do Amapari', 'Vitória do Jari', 'Calçoene'
    ]
  },
  {
    uf: 'RR',
    name: 'Roraima',
    region: 'Norte',
    cities: [
      'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima', 'Cantá',
      'Mucajaí', 'Alto Alegre', 'Bonfim', 'Amajari', 'São Luiz'
    ]
  }
];

// Dicionário Oficial de Bairros e Regiões por Cidade (IBGE / Correios DNE / Google Maps)
export const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  // SÃO PAULO
  'São Paulo': [
    'Centro', 'Centro Histórico', 'Bela Vista', 'Consolação', 'Higienópolis', 'Santa Cecília',
    'Bom Retiro', 'Brás', 'Pari', 'Cambuci', 'Liberdade', 'Aclimação',
    'Pinheiros', 'Itaim Bibi', 'Vila Olímpia', 'Moema',
    'Vila Mariana', 'Jardins', 'Jardim Paulista',
    'Cerqueira César', 'Perdizes', 'Pompéia', 'Lapa', 'Alto de Pinheiros',
    'Vila Madalena', 'Morumbi', 'Campo Belo', 'Brooklin', 'Santo Amaro',
    'Chácara Santo Antônio', 'Panamby', 'Butantã', 'Santana', 'Tucuruvi',
    'Tatuapé', 'Mooca', 'Anália Franco', 'Ipiranga', 'Saúde',
    'Jabaquara', 'Barra Funda', 'Penha',
    'Vila Prudente', 'Freguesia do Ó', 'Casa Verde', 'Pirituba', 'São Mateus',
    'Itaquera', 'Vila Leopoldina', 'Belém', 'Mandaqui', 'Tremembé'
  ],
  'Campinas': [
    'Centro', 'Cambuí', 'Taquaral', 'Nova Campinas', 'Barão Geraldo',
    'Guanabara', 'Mansões Santo Antônio', 'Jardim Chapadão', 'Castelo', 'Ponte Preta',
    'Swift', 'Vila Nova', 'Jardim Proença', 'Jardim Flamboyant', 'Vila Itapura',
    'Sousas', 'Joaquim Egídio', 'Parque Prado', 'Amoreiras', 'Jardim Eulina',
    'Jardim Garcia', 'Vila Mimosa', 'Vila Industrial', 'Jardim Aurélia', 'Ouro Verde'
  ],
  'Guarulhos': [
    'Centro', 'Macedo', 'Vila Galvão', 'Gopouva', 'Maia',
    'Picanço', 'Bom Clima', 'Jardim Tranquilidade', 'Taboão', 'Cumbica',
    'Bonsucesso', 'Ponte Grande', 'Vila Augusta', 'Bela Vista', 'Cecap',
    'Invernada', 'Jardim City', 'Continental', 'Parque Renato Maia', 'Parque Cecap'
  ],
  'São Bernardo do Campo': [
    'Centro', 'Rudge Ramos', 'Nova Petrópolis', 'Assunção', 'Baeta Neves',
    'Demarchi', 'Paulicéia', 'Anchieta', 'Jordanópolis', 'Alvarenga',
    'Planalto', 'Taboão', 'Ferrazópolis', 'Vila Euclides', 'Terra Nova II'
  ],
  'Santo André': [
    'Centro', 'Bairro Jardim', 'Campestre', 'Vila Assunção', 'Vila Bastos',
    'Vila Gilda', 'Casa Branca', 'Utinga', 'Parque das Nações', 'Vila Pires',
    'Vila Alice', 'Vila Metalúrgica', 'Santa Maria', 'Paraíso', 'Jardim Bela Vista'
  ],
  'São José dos Campos': [
    'Centro', 'Jardim das Colinas', 'Vila Ema', 'Jardim Aquarius', 'Jardim Esplanada',
    'Urbanova', 'Jardim Maringá', 'Vila Adyana', 'Santana', 'Parque Industrial',
    'Jardim Satélite', 'Bosque dos Eucaliptos', 'Jardim Oriente', 'Chácaras Reunidas', 'Eugenio de Melo'
  ],
  'Ribeirão Preto': [
    'Centro', 'Jardim Botânico', 'Jardim Irajá', 'Jardim Sumaré', 'Alto da Boa Vista',
    'Jardim Canadá', 'Bonfim Paulista', 'Nova Aliança', 'Vila Tibério', 'Campos Elíseos',
    'Ipiranga', 'Jardim Paulista', 'Parque Ribeirão Preto', 'Santa Cruz', 'Jardim Califórnia'
  ],
  'Sorocaba': [
    'Centro', 'Campolim', 'Jardim Santa Rosália', 'Vila Carvalho', 'Além Ponte',
    'Trujillo', 'Jardim Faculdade', 'Wanel Ville', 'Vila Hortência', 'Vila Santana',
    'Jardim Gonçalves', 'Alto da Boa Vista', 'Éden', 'Brigadeiro Tobias', 'Jardim América'
  ],
  'Santos': [
    'Gonzaga', 'Boqueirão', 'Embaré', 'Ponta da Praia', 'Aparecida',
    'Centro', 'Encruzilhada', 'Marapé', 'Campo Grande', 'José Menino',
    'Vila Mathias', 'Vila Belmiro', 'Macuco', 'Pompéia', 'Vila Rica'
  ],
  'São Caetano do Sul': [
    'Centro', 'Santa Paula', 'Bairro Barcelona', 'Bairro Fundação', 'Cerâmica',
    'Santo Antônio', 'Osvaldo Cruz', 'Olímpico', 'Bairro Mauá', 'Jardim São Caetano'
  ],
  'Osasco': [
    'Centro', 'Vila Yara', 'Vila Campesina', 'Bela Vista', 'Cidade de Deus',
    'Umuarama', 'Jaguaribe', 'Presidente Altino', 'Quitaúna', 'Km 18',
    'Rochdale', 'Jardim das Flores', 'IAPI', 'Padroeira', 'Vussununga'
  ],
  'Jundiaí': [
    'Centro', 'Anhangabaú', 'Vila Arens', 'Chácara Urbana', 'Jardim Samambaia',
    'Ponte de São João', 'Vila Progresso', 'Eloy Chaves', 'Retiro', 'Caxambu'
  ],
  'Piracicaba': [
    'Centro', 'São Dimas', 'Bairro Alto', 'Nova Piracicaba', 'Vila Rezende',
    'Paulicéia', 'Água Branca', 'Campestre', 'Dois Córregos', 'Santa Teresinha'
  ],
  'Bauru': [
    'Centro', 'Jardim América', 'Altos da Cidade', 'Vila Universitária', 'Jardim Estoril',
    'Vila Cardia', 'Geisel', 'Mary Dota', 'Bela Vista', 'Bauru XVI'
  ],
  'Barueri': [
    'Alphaville', 'Tamboré', 'Centro', 'Jardim Silveira', 'Jardim Belval',
    'Cruz Preta', 'Vila Porto', 'Aldeia da Serra', 'Parque Viana', 'Jardim dos Camargos'
  ],

  // RIO DE JANEIRO
  'Rio de Janeiro': [
    'Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca', 'Recreio dos Bandeirantes',
    'Botafogo', 'Flamengo', 'Tijuca', 'Centro', 'Laranjeiras',
    'Glória', 'Catete', 'Santa Teresa', 'Leme', 'Gávea',
    'São Conrado', 'Jardim Botânico', 'Humaitá', 'Urca', 'Cosme Velho',
    'Méier', 'Madureira', 'Campo Grande', 'Bangu', 'Jacarepaguá',
    'Freguesia (Jacarepaguá)', 'Taquara', 'Pechincha', 'Vila Isabel', 'Grajaú',
    'Maracanã', 'São Cristóvão', 'Engenho de Dentro', 'Ilha do Governador', 'Penha',
    'Ramos', 'Bonsucesso', 'Pavuna', 'Irajá', 'Anchieta',
    'Realengo', 'Santa Cruz', 'Guaratiba', 'Vargem Grande', 'Vargem Pequena'
  ],
  'Niterói': [
    'Icaraí', 'Centro', 'Santa Rosa', 'Ingá', 'São Francisco',
    'Charitas', 'Piratininga', 'Itaipu', 'Camboinhas', 'Fonseca',
    'Barreto', 'Jurujuba', 'Engenhoca', 'Pendotiba', 'Boa Viagem'
  ],
  'São Gonçalo': [
    'Centro', 'Alcântara', 'Zé Garoto', 'Neves', 'Mutondo',
    'Trindade', 'Colubandê', 'Paraíso', 'Pacheco', 'Barro Vermelho'
  ],
  'Duque de Caxias': [
    'Centro', 'Jardim 25 de Agosto', 'Parque Duque', 'Gramacho', 'Saracuruna',
    'Vila São Luís', 'Vila Meriti', 'Santa Cruz da Serra', 'Imbariê', 'Chácaras Arcampo'
  ],
  'Nova Iguaçu': [
    'Centro', 'Jardim Tropical', 'Posse', 'Comendador Soares', 'Austin',
    'Rancho Novo', 'K11', 'Luz', 'Moquetá', 'Vila Nova'
  ],
  'Petrópolis': [
    'Centro Histórico', 'Itaipava', 'Quitandinha', 'Valparaíso', 'Retiro',
    'Bingen', 'Mosela', 'Castelânea', 'Coronel Veiga', 'Araras'
  ],
  'Volta Redonda': [
    'Aterrado', 'Vila Santa Cecília', 'Centro', 'Retiro', 'Conforto',
    'Siderópolis', 'Laranjal', 'Vila Americana', 'Jardim Amália', 'Barra Mansa'
  ],
  'Macaé': [
    'Cavaleiros', 'Praia Campista', 'Centro', 'Riviera Fluminense', 'Granja dos Cavaleiros',
    'Glória', 'Miramar', 'Parque Aeroporto', 'Imbetiba', 'Bela Vista'
  ],

  // MINAS GERAIS
  'Belo Horizonte': [
    'Centro', 'Savassi', 'Lourdes', 'Funcionários', 'Belvedere',
    'Santo Agostinho', 'Sion', 'Anchieta', 'Serra', 'Cruzeiro',
    'Buritis', 'Castelo', 'Pampulha', 'São Bento', 'Mangabeiras',
    'Santa Efigênia', 'Floresta', 'Prado', 'Gutierrez', 'Grajaú',
    'Barro Preto', 'Carlos Prates', 'Padre Eustáquio', 'Caiçara', 'Ouro Preto (BH)',
    'Castelo', 'Alípio de Melo', 'Sagrada Família', 'Cidade Nova', 'Palmares',
    'União', 'Ipiranga', 'Barreiro', 'Venda Nova', 'Santa Lúcia'
  ],
  'Uberlândia': [
    'Centro', 'Fundinho', 'Santa Mônica', 'Martins', 'Tibery',
    'Brasil', 'Tabajaras', 'Osvaldo Rezende', 'Saraiva', 'Umuarama',
    'Granja Marileusa', 'Jardim Finotti', 'Lidice', 'Cazeca', 'Jardim Karaíba'
  ],
  'Contagem': [
    'Eldorado', 'Centro', 'Cabral', 'Inconfidentes', 'Novo Eldorado',
    'Riacho das Pedras', 'Industrial', 'Fonte Grande', 'Alvorada', 'Petrolândia'
  ],
  'Juiz de Fora': [
    'Centro', 'São Mateus', 'Cascatinha', 'Granbery', 'Santa Helena',
    'Bom Pastor', 'Alto dos Passos', 'Benfica', 'Manoel Honório', 'Poço Rico'
  ],
  'Betim': [
    'Centro', 'Ingá', 'Brasiléia', 'Jardim da Cidade', 'PTB',
    'Alterosas', 'Dom Bosco', 'Filadélfia', 'Chácara', 'Betim Industrial'
  ],
  'Montes Claros': [
    'Centro', 'Major Prates', 'Todos os Santos', 'Melo', 'Ibituruna',
    'São Luiz', 'Maracanã', 'Morada do Sol', 'Cândida Câmara', 'Augusta Mota'
  ],
  'Uberaba': [
    'Centro', 'São Benedito', 'Estados Unidos', 'Manoel Mendes', 'Abadia',
    'Mercês', 'Santa Marta', 'Universitário', 'Olinda', 'Fabrício'
  ],

  // RIO GRANDE DO SUL
  'Porto Alegre': [
    'Centro Histórico', 'Moinhos de Vento', 'Bela Vista', 'Menino Deus', 'Petrópolis',
    'Cidade Baixa', 'Bom Fim', 'Mont\'Serrat', 'Três Figueiras', 'Rio Branco',
    'Praia de Belas', 'Floresta', 'São Geraldo', 'Passo d\'Areia', 'Higienópolis',
    'Auxiliadora', 'Independência', 'Jardim Botânico', 'Santana', 'Azenha',
    'Partenon', 'Cristal', 'Tristeza', 'Ipanema', 'Chácara das Pedras',
    'Jardim Europa', 'Humaitá', 'Navegantes', 'Restinga', 'Sarandi'
  ],
  'Caxias do Sul': [
    'Centro', 'Lourdes', 'Pio X', 'São Pelegrino', 'Panazzolo',
    'Rio Branco', 'Exposição', 'Madureira', 'Kayser', 'Bela Vista',
    'Cruzeiro', 'Jardim América', 'Santa Catarina', 'Interlagos', 'Sagrada Família'
  ],
  'Canoas': [
    'Centro', 'Marechal Rondon', 'Niterói', 'Harmonia', 'Mathias Velho',
    'Fátima', 'Rio Branco', 'São Luís', 'Estância Velha', 'Igara'
  ],
  'Pelotas': [
    'Centro', 'Areal', 'Três Vendas', 'Laranjal', 'Fragata',
    'São Gonçalo', 'Guabiroba', 'Simões Lopes', 'Porto', 'Dunas'
  ],
  'Santa Maria': [
    'Centro', 'Nossa Senhora de Fátima', 'Camobi', 'Nossa Senhora Medianeira', 'Patronato',
    'Dores', 'Menino Jesus', 'Rosário', 'Bonfim', 'Itararé'
  ],

  // PARANÁ
  'Curitiba': [
    'Batel', 'Bigorrilho (Champagnat)', 'Centro', 'Água Verde', 'Cabral',
    'Juvevê', 'Portão', 'Santa Felicidade', 'Ecoville (Mossunguê)', 'Mercês',
    'Rebouças', 'Cristo Rei', 'Alto da XV', 'Alto da Glória', 'Ahú',
    'Hugo Lange', 'Boa Vista', 'Bacacheri', 'Capão Raso', 'Novo Mundo',
    'Boqueirão', 'Hauer', 'Fanny', 'Tarumã', 'Prado Velho',
    'Vila Izabel', 'Seminário', 'Campina do Siqueira', 'Santo Inácio', 'Botiatuvinha',
    'Pilarzinho', 'São Lourenço', 'Tijucas', 'Cidade Industrial de Curitiba (CIC)', 'Xaxim'
  ],
  'Londrina': [
    'Centro', 'Gleba Fazenda Palhano', 'Jardim Higienópolis', 'Igapó', 'Vila Brasil',
    'Bandeirantes', 'Jardim Shangri-lá', 'Vila Ipiranga', 'Aeroporto', 'Cinco Conjuntos',
    'Jardim Aurora', 'Leonor', 'Califórnia', 'Jardim Petrópolis', 'Vila Larsen'
  ],
  'Maringá': [
    'Zona 01 (Centro)', 'Zona 02', 'Zona 03 (Vila Operária)', 'Zona 04', 'Zona 05',
    'Zona 07', 'Jardim Alvorada', 'Gleba Patrimônio Maringá', 'Jardim Novo Horizonte', 'Parque do Ingá',
    'Vila Santo Antônio', 'Jardim Mandacaru', 'Parque das Grevíleas', 'Jardim Aclimação', 'Parque Residencial Cidade Nova'
  ],
  'Ponta Grossa': [
    'Centro', 'Oficinas', 'Uvaranas', 'Nova Rússia', 'Estrela',
    'Jardim Carvalho', 'Ronda', 'Contorno', 'Chapada', 'Boa Vista'
  ],
  'Cascavel': [
    'Centro', 'Coqueiral', 'Parque São Paulo', 'Cancelli', 'Neva',
    'Recanto Tropical', 'Country', 'Alto Alegre', 'Santa Cruz', 'Cascavel Velho'
  ],
  'São José dos Pinhais': [
    'Centro', 'Afonso Pena', 'São Pedro', 'Aristocrata', 'Boneca do Iguaçu',
    'Guatupê', 'Cruzeiro', 'Costeira', 'Bom Jesus', 'Borda do Campo'
  ],
  'Foz do Iguaçu': [
    'Centro', 'Vila Yolanda', 'Jardim América', 'Vila Portes', 'Maracanã',
    'Porto Meira', 'Três Lagoas', 'Vila A', 'KLP', 'Parque Imperatriz'
  ],

  // SANTA CATARINA
  'Florianópolis': [
    'Centro', 'Trindade', 'Itacorubi', 'Córrego Grande', 'Agronômica',
    'Santa Mônica', 'João Paulo', 'Parque São Jorge', 'Pantanal', 'Saco dos Limões',
    'Campeche', 'Lagoa da Conceição', 'Jurerê Internacional', 'Jurerê Tradicional', 'Canasvieiras',
    'Ingleses do Rio Vermelho', 'Coqueiros', 'Estreito', 'Abraão', 'Capoeiras',
    'Balneário', 'Santo Antônio de Lisboa', 'Sambaqui', 'Rio Tavares', 'Cacupé'
  ],
  'Joinville': [
    'Centro', 'América', 'Atiradores', 'Glória', 'Anita Garibaldi',
    'Saguaçu', 'Costa e Silva', 'Santo Antônio', 'Bom Retiro', 'Floresta',
    'Itaum', 'Bucarein', 'Pirabeiraba', 'Vila Nova', 'Aventureiro'
  ],
  'Blumenau': [
    'Centro', 'Victor Konder', 'Vila Nova', 'Velha', 'Garcia',
    'Itoupava Seca', 'Itoupava Norte', 'Ponta Aguda', 'Jardim Blumenau', 'Escola Agrícola',
    'Boa Vista', 'Vorstadt', 'Água Verde', 'Salto do Norte', 'Fortaleza'
  ],
  'São José': [
    'Campinas', 'Kobrasol', 'Barreiros', 'Praia Comprida', 'Centro Histórico',
    'Nossa Senhora do Rosário', 'Bela Vista', 'Fazenda Santo Antônio', 'Roçado', 'Forquilhinhas'
  ],
  'Balneário Camboriú': [
    'Centro', 'Barra Sul', 'Barra Norte', 'Pioneiros', 'Nações',
    'Praia dos Amores', 'Ariribá', 'Estados', 'Municípios', 'Vila Real'
  ],
  'Itajaí': [
    'Centro', 'Fazenda', 'Praia Brava', 'Vila Operária', 'São João',
    'Dom Bosco', 'Cordeiros', 'São Vicente', 'Ressacada', 'Cabeçudas'
  ],
  'Chapecó': [
    'Centro', 'Maria Goretti', 'Santa Maria', 'Efapi', 'Passo dos Fortes',
    'Jardim Itália', 'Bela Vista', 'São Cristóvão', 'Engenho Braun', 'Seminário'
  ],

  // BAHIA
  'Salvador': [
    'Barra', 'Ondina', 'Rio Vermelho', 'Pituba', 'Itaigara',
    'Caminho das Árvores', 'Graça', 'Vitória', 'Campo Grande', 'Horto Florestal',
    'Brotas', 'Canela', 'Federação', 'Costa Azul', 'Armação',
    'Imbuí', 'Patamares', 'Piatã', 'Itapuã', 'Stella Maris',
    'Cabula', 'Bonfim', 'Ribeira', 'Comércio', 'Pelourinho (Centro Histórico)',
    'Pernambués', 'Liberdade', 'São Cristóvão', 'Paripe', 'Periperi'
  ],
  'Feira de Santana': [
    'Centro', 'Santa Mônica', 'Kalilândia', 'Brasília', 'Capuchinhos',
    'Ponto Central', 'Muchila', 'Sim', 'Tomba', 'Mangabeira',
    'Sobradinho', 'Parque Ipê', 'Queimadinha', 'Campo Limpo', 'Papagaio'
  ],
  'Vitória da Conquista': [
    'Centro', 'Candeias', 'Recreio', 'Brasil', 'Bela Vista',
    'Alto Maron', 'Boa Vista', 'Patagônia', 'Ibirapuera', 'Felícia'
  ],
  'Camaçari': [
    'Centro', 'Polo Petroquímico', 'Gleba A', 'Gleba B', 'Gleba E',
    'Abrantes', 'Guarajuba', 'Arembepe', 'Jauá', 'Monte Gordo'
  ],
  'Lauro de Freitas': [
    'Vilas do Atlântico', 'Centro', 'Buraquinho', 'Ipitanga', 'Miragem',
    'Portão', 'Estrada do Coco', 'Areia Branca', 'Itinga', 'Vida Nova'
  ],

  // PERNAMBUCO
  'Recife': [
    'Boa Viagem', 'Pina', 'Jaqueira', 'Parnamirim', 'Casa Forte',
    'Espinheiro', 'Graças', 'Madalena', 'Derby', 'Ilha do Leite',
    'Santo Amaro', 'Boa Vista', 'Recife Antigo (Bairro do Recife)', 'Torre', 'Rosarinho',
    'Aflitos', 'Encruzilhada', 'Cordeiro', 'Várzea', 'Caxangá',
    'Afogados', 'Ipsep', 'Imbiribeira', 'Casa Amarela', 'Dois Irmãos'
  ],
  'Olinda': [
    'Carmo (Sítio Histórico)', 'Bairro Novo', 'Casa Caiada', 'Rio Doce', 'Jardim Atlântico',
    'Varadouro', 'Peixinhos', 'Ouro Preto', 'Amparo', 'Guadalupe'
  ],
  'Jaboatão dos Guararapes': [
    'Piedade', 'Candeias', 'Barra de Jangada', 'Prazeres', 'Jaboatão Centro',
    'Cavaleiro', 'Curado', 'Muribeca', 'Socorro', 'Guararapes'
  ],
  'Caruaru': [
    'Maurício de Nassau', 'Centro', 'Universitário', 'Petrópolis', 'São Francisco',
    'Salgado', 'Boa Vista', 'Kennedy', 'Divinópolis', 'Indianópolis'
  ],
  'Petrolina': [
    'Centro', 'Areia Branca', 'Atrás da Banca', 'Vila Eduardo', 'Gercino Coelho',
    'Jardim Maravilha', 'Cohab Massangano', 'Dom Malan', 'Jardim Amazonas', 'KM 2'
  ],

  // CEARÁ
  'Fortaleza': [
    'Aldeota', 'Meireles', 'Mucuripe', 'Praia de Iracema', 'Varjota',
    'Cocó', 'Papicu', 'Dionísio Torres', 'Fátima', 'Centro',
    'Parquelândia', 'Benfica', 'Messejana', 'Cambeba', 'Engenheiro Luciano Cavalcante',
    'Guararapes', 'Cidade dos Funcionários', 'Montese', 'Rodolfo Teófilo', 'São Gerardo',
    'Joaquim Távora', 'Passaré', 'Maraponga', 'Mondubim', 'Edson Queiroz'
  ],
  'Caucaia': [
    'Centro', 'Icaraí', 'Cumbuco', 'Jurema', 'Araturi',
    'Tabapuá', 'Nova Metrópole', 'Parque Potira', 'Pacheco', 'Guaiúba'
  ],
  'Juazeiro do Norte': [
    'Centro', 'Lagoa Seca', 'Triângulo', 'Salesianos', 'Novo Juazeiro',
    'Pio XII', 'Franciscanos', 'Tiradentes', 'Romeirão', 'São Miguel'
  ],
  'Sobral': [
    'Centro', 'Campo dos Velhos', 'Derby Club', 'Pedrinhas', 'Sina',
    'Cohab I', 'Cohab II', 'Dom Expedito', 'Junco', 'Renato Parente'
  ],

  // DISTRITO FEDERAL
  'Brasília': [
    'Plano Piloto (Asa Sul)', 'Plano Piloto (Asa Norte)', 'Setor Comercial Sul (SCS)', 'Setor Comercial Norte (SCN)',
    'Setor Hoteleiro Sul (SHS)', 'Setor Hoteleiro Norte (SHN)', 'Setor Bancário Sul (SBS)', 'Setor Bancário Norte (SBN)',
    'Sudoeste / Octogonal', 'Noroeste', 'Lago Sul', 'Lago Norte', 'Águas Claras',
    'Taguatinga Centro', 'Taguatinga Norte', 'Taguatinga Sul', 'Guará I', 'Guará II',
    'Ceilândia Centro', 'Ceilândia Norte', 'Ceilândia Sul', 'Samambaia Norte', 'Samambaia Sul',
    'Sobradinho I', 'Sobradinho II', 'Gama', 'Santa Maria', 'Vicente Pires',
    'Cruzeiro Velho', 'Cruzeiro Novo', 'Núcleo Bandeirante', 'Park Way', 'Riacho Fundo I',
    'Riacho Fundo II', 'Recanto das Emas', 'São Sebastião', 'Jardim Botânico', 'Planaltina (DF)'
  ],

  // GOIÁS
  'Goiânia': [
    'Setor Bueno', 'Setor Marista', 'Setor Oeste', 'Jardim Goiás', 'Setor Sul',
    'Setor Central', 'Nova Suíça', 'Setor Pedro Ludovico', 'Jardim América', 'Alto da Glória',
    'Setor Coimbra', 'Setor Campinas', 'Setor Universitário', 'Setor Jaó', 'Parque Amazônia',
    'Jardim Atlântico', 'Parque das Laranjeiras', 'Setor Aeroporto', 'Vila Nova', 'Jardim Guanabara'
  ],
  'Aparecida de Goiânia': [
    'Centro', 'Vila Brasília', 'Jardim Luz', 'Jardim Maria Inês', 'Garavelo',
    'Buriti Sereno', 'Parque Primavera', 'Cidade Livre', 'Parque Real', 'Jardim Belo Horizonte'
  ],
  'Anápolis': [
    'Centro', 'Jundiaí', 'Bairro Maracanã', 'Vila Jaiara', 'Cidade Universitária',
    'Parque Brasília', 'Jardim Europa', 'Santa Maria de Nazareth', 'São Joaquim', 'DAIA'
  ],
  'Rio Verde': [
    'Centro', 'Setor Morada do Sol', 'Setor Central', 'Jardim Presidente', 'Bairro Popular',
    'Setor Pauzanes', 'Solar do Agreste', 'Parque das Laranjeiras', 'Santo Antônio', 'Promissão'
  ],

  // ESPÍRITO SANTO
  'Vitória': [
    'Praia do Canto', 'Jardim da Penha', 'Jardim Camburi', 'Enseada do Suá', 'Santa Lúcia',
    'Mata da Praia', 'Centro', 'Bento Ferreira', 'Barro Vermelho', 'Praia do Suá',
    'República', 'Goiabeiras', 'Maruípe', 'Consolação', 'Ilha do Boi'
  ],
  'Vila Velha': [
    'Praia da Costa', 'Itapuã', 'Praia de Itaparica', 'Centro', 'Glória',
    'Coqueiral de Itaparica', 'Cristóvão Colombo', 'Santa Inês', 'Aribiri', 'Cobilândia'
  ],
  'Serra': [
    'Laranjeiras', 'Valparaíso', 'Jacaraípe', 'Manguinhos', 'Colina de Laranjeiras',
    'Serra Sede', 'Morada de Laranjeiras', 'Carapina', 'Jardim Limoeiro', 'Nova Almeida'
  ],
  'Cariacica': [
    'Campo Grande', 'Itacibá', 'Jardim América', 'Bela Aurora', 'Vila Capixaba',
    'Alto Lage', 'São Geraldo', 'Cruzeiro do Sul', 'Porto de Santana', 'Tucum'
  ],

  // AMAZONAS
  'Manaus': [
    'Centro', 'Adrianópolis', 'Nossa Senhora das Graças (Vieiralves)', 'Ponta Negra', 'Flores',
    'Parque 10 de Novembro', 'Aleixo', 'Chapada', 'Dom Pedro', 'São Geraldo',
    'Tarumã', 'Cachoeirinha', 'Praça 14 de Janeiro', 'Petrópolis', 'Japiim',
    'Coroado', 'Cidade Nova', 'Compensa', 'São Jorge', 'Nova Cidade'
  ],

  // PARÁ
  'Belém': [
    'Nazaré', 'Umarizal', 'Batista Campos', 'Marco', 'Reduto',
    'Campina (Comércio)', 'São Brás', 'Cidade Velha', 'Cremação', 'Guamá',
    'Pedreira', 'Telégrafo', 'Jurunas', 'Souza', 'Canudos'
  ],
  'Ananindeua': [
    'Cidade Nova', 'Coqueiro', 'Centro', 'Guanabara', 'Jaderlândia',
    'Águas Lindas', 'Distrito Industrial', 'Atalaia', 'Maguari', 'Aurá'
  ],

  // MATO GROSSO
  'Cuiabá': [
    'Goiabeiras', 'Bosque da Saúde', 'Centro', 'Duque de Caxias', 'Jardim Cuiabá',
    'Jardim das Américas', 'Alvorada', 'Santa Rosa', 'Quilombo', 'Porto',
    'Tijucal', 'CPA I', 'CPA II', 'CPA IV', 'Morada do Ouro'
  ],
  'Várzea Grande': [
    'Centro', 'Cristo Rei', 'Jardim Glória', 'Ponte Nova', 'Manga',
    'Marajoara', 'Costa Verde', 'Parque do Lago', 'Água Limpa', 'Vila Arthur'
  ],

  // MATO GROSSO DO SUL
  'Campo Grande': [
    'Centro', 'Chácara Cachoeira', 'Santa Fé', 'Jardim dos Estados', 'Autonomista',
    'Tiradentes', 'Monte Castelo', 'São Francisco', 'Carandá Bosque', 'Amambai',
    'Universitário', 'Pioneiros', 'Guanandi', 'Aero Rancho', 'Coophavila II'
  ],
  'Dourados': [
    'Centro', 'Vila Progresso', 'Jardim Flórida', 'Vila Industrial', 'Parque Alvorada',
    'Jardim Márcia', 'Jardim Guanabara', 'Cabeceira Alegre', 'Izidro Pedroso', 'Vila Aurora'
  ],

  // MARANHÃO
  'São Luís': [
    'Renascença I', 'Renascença II', 'Ponta d\'Areia', 'Calhau', 'Olho d\'Água',
    'Península da Ponta d\'Areia', 'São Francisco', 'Centro Histórico', 'Turu', 'Cohama',
    'Cofibras', 'Monte Castelo', 'Angelim', 'Vinhais', 'Anil'
  ],
  'Imperatriz': [
    'Centro', 'Juçara', 'Bacuri', 'Três Poderes', 'Nova Imperatriz',
    'Maranhão Novo', 'Santa Rita', 'Vila Lobão', 'Jardim Tropical', 'Parque Sanharol'
  ],

  // PARAÍBA
  'João Pessoa': [
    'Tambaú', 'Manaíra', 'Cabo Branco', 'Bessa', 'Altiplano Cabo Branco',
    'Intermares', 'Jardim Oceania', 'Miramar', 'Torre', 'Centro',
    'Estados', 'Bancários', 'Mangabeira', 'Jaguaribe', 'Castelo Branco'
  ],
  'Campina Grande': [
    'Centro', 'Prata', 'Catolé', 'Alto Branco', 'Mirante',
    'Conceição', 'Liberdade', 'Bodocongó', 'Cruzeiro', 'Malvinas'
  ],

  // RIO GRANDE DO NORTE
  'Natal': [
    'Ponta Negra', 'Tirol', 'Petrópolis', 'Capim Macio', 'Candelária',
    'Lagoa Nova', 'Barro Vermelho', 'Alecrim', 'Centro', 'Ribeira',
    'Praia do Meio', 'Nova Descoberta', 'Neópolis', 'Pitimbú', 'Potengi'
  ],
  'Mossoró': [
    'Centro', 'Nova Betânia', 'Doze Anos', 'Abolição I', 'Abolição II',
    'Santo Antônio', 'Aeroporto', 'Boa Vista', 'Alto de São Manoel', 'Rincão'
  ],

  // ALAGOAS
  'Maceió': [
    'Ponta Verde', 'Pajuçara', 'Jatiúca', 'Mangabeiras', 'Cruz das Almas',
    'Farol', 'Centro', 'Poço', 'Pinheiro', 'Gruta de Lourdes',
    'Serraria', 'Antares', 'Tabuleiro do Martins', 'Benedito Bentes', 'Trapiche da Barra'
  ],

  // PIAUÍ
  'Teresina': [
    'Jóquei', 'Fátima', 'São Cristóvão', 'Ininga', 'Ilhotas',
    'Centro', 'Noivos', 'Mocambinho', 'Dirceu Arcoverde', 'Morada do Sol',
    'Piçarra', 'Vermelha', 'Macaúba', 'Cabral', 'Primavera'
  ],

  // SERGIPE
  'Aracaju': [
    '13 de Julho', 'Jardins', 'Garcia', 'Atalaia', 'Coroa do Meio',
    'Centro', 'Grageru', 'Suíssa', 'Luzia', 'São José',
    'Farolândia', 'Aeroporto', 'Salgado Filho', 'Aruana', 'Inácio Barbosa'
  ],

  // RONDÔNIA
  'Porto Velho': [
    'Centro', 'Olaria', 'Arigolândia', 'São Cristóvão', 'Liberdade',
    'Embratel', 'Nova Porto Velho', 'Cuniã', 'Areal', 'Pedrinhas'
  ],

  // TOCANTINS
  'Palmas': [
    'Plano Diretor Sul (104 Sul, 106 Sul, 204 Sul...)',
    'Plano Diretor Norte (104 Norte, 106 Norte, 204 Norte...)',
    'Graciosa', 'Taquaralto', 'Aureny I', 'Aureny II', 'Aureny III',
    'Bela Vista', 'Santa Fé', 'Morada do Sol'
  ],

  // ACRE
  'Rio Branco': [
    'Centro', 'Bosque', 'Cerâmica', 'Floresta', 'Estação Experimental',
    'Manoel Julião', 'Conjunto Tangará', 'Conjunto Esperança', 'Vila Ivonete', 'Calafate'
  ],

  // AMAPÁ
  'Macapá': [
    'Centro', 'Santa Rita', 'Trem', 'Jesus de Nazaré', 'Central',
    'Laguinho', 'Pacoval', 'Buritizal', 'Araxá', 'Cabralzinho'
  ],

  // RORAIMA
  'Boa Vista': [
    'Centro', 'São Francisco', 'Mecejana', 'Paraviana', 'Caçari',
    'Aparecida', 'Aeroporto', 'Caimbé', 'Liberdade', 'Buritis'
  ]
};

/**
 * Retorna as cidades cadastradas para um Estado (UF)
 */
export function getCitiesByState(uf: string): string[] {
  const found = BRAZIL_STATES.find(s => s.uf.toUpperCase() === uf.toUpperCase());
  return found ? found.cities : [];
}

/**
 * Retorna a lista de bairros oficiais e conhecidos de uma cidade (ou bairros padrão de polo se não cadastrado)
 * Regra: Sempre inclui 'Todos' como primeira opção para busca global em toda a cidade
 */
export function getNeighborhoodsByCity(uf: string, city: string): string[] {
  if (!city) return ['Todos'];
  const cleanCity = city.trim();

  let neighList: string[] = [];

  // 1. Procura direta pelo nome exato
  if (CITY_NEIGHBORHOODS[cleanCity]) {
    neighList = CITY_NEIGHBORHOODS[cleanCity];
  } else {
    // 2. Procura case-insensitive
    const matchedKey = Object.keys(CITY_NEIGHBORHOODS).find(
      k => k.toLowerCase() === cleanCity.toLowerCase()
    );
    if (matchedKey && CITY_NEIGHBORHOODS[matchedKey]) {
      neighList = CITY_NEIGHBORHOODS[matchedKey];
    } else {
      // 3. Fallback inteligente para cidades menores ou ainda não tabeladas
      neighList = [
        'Centro',
        'Região Central',
        'Distrito Industrial',
        'Zona Norte',
        'Zona Sul',
        'Zona Leste',
        'Zona Oeste',
        'Bairro Universitário',
        'Jardim América',
        'Bela Vista',
        'Vila Nova',
        'Parque Residencial'
      ];
    }
  }

  // Inclui 'Todos' como primeira opção para permitir varredura global em toda a cidade
  return ['Todos', ...neighList.filter(n => n.toLowerCase() !== 'todos')];
}

/**
 * Retorna todos os Estados com sigla e nome formatado
 */
export function getAllBrazilStates(): { uf: string; name: string }[] {
  return BRAZIL_STATES.map(s => ({ uf: s.uf, name: s.name }));
}
