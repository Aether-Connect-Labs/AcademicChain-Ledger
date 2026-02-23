// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AcademicLedger_SC {
    address public owner;
    mapping(address => bool) public institutions;
    mapping(bytes32 => bool) private isHashUsed;

    struct Certificado {
        string estudiante;
        string institucion;
        string fechaEmision;
        string hashXRP;
        string hashAlgo;
        string ipfsURI;
        address studentWallet;
        address institutionWallet;
    }

    mapping(bytes32 => Certificado) private certificados;

    event InstitutionAdded(address indexed institution);
    event InstitutionRemoved(address indexed institution);
    event CredentialMintRequested(address indexed institution, address indexed student, bytes32 uniqueHash, string ipfsURI);
    event CertificadoRegistrado(
        bytes32 indexed uniqueHash,
        string estudiante,
        string institucion,
        string fechaEmision,
        string hashXRP,
        string hashAlgo,
        string ipfsURI
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyInstitution() {
        require(institutions[msg.sender], "Not authorized institution");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addInstitution(address _institutionAddress) external onlyOwner {
        require(_institutionAddress != address(0), "Invalid address");
        institutions[_institutionAddress] = true;
        emit InstitutionAdded(_institutionAddress);
    }

    function removeInstitution(address _institutionAddress) external onlyOwner {
        institutions[_institutionAddress] = false;
        emit InstitutionRemoved(_institutionAddress);
    }

    function mintCredential(address student, bytes32 uniqueHash, string memory ipfsURI) external onlyInstitution {
        require(student != address(0), "Invalid student");
        require(uniqueHash != bytes32(0), "Invalid hash");
        require(bytes(ipfsURI).length > 0, "Invalid ipfsURI");
        require(!isHashUsed[uniqueHash], "Duplicate credential");
        isHashUsed[uniqueHash] = true;
        emit CredentialMintRequested(msg.sender, student, uniqueHash, ipfsURI);
        // HTS mint is executed off-chain by the server using the emitted data.
    }

    function mintTripleCredential(
        address student,
        bytes32 uniqueHash,
        string memory ipfsURI,
        string memory estudiante,
        string memory institucion,
        string memory fechaEmision,
        string memory hashXRP,
        string memory hashAlgo
    ) external onlyInstitution {
        require(student != address(0), "Invalid student");
        require(uniqueHash != bytes32(0), "Invalid hash");
        require(bytes(ipfsURI).length > 0, "Invalid ipfsURI");
        require(!isHashUsed[uniqueHash], "Duplicate credential");

        isHashUsed[uniqueHash] = true;

        certificados[uniqueHash] = Certificado({
            estudiante: estudiante,
            institucion: institucion,
            fechaEmision: fechaEmision,
            hashXRP: hashXRP,
            hashAlgo: hashAlgo,
            ipfsURI: ipfsURI,
            studentWallet: student,
            institutionWallet: msg.sender
        });

        emit CredentialMintRequested(msg.sender, student, uniqueHash, ipfsURI);
        emit CertificadoRegistrado(
            uniqueHash,
            estudiante,
            institucion,
            fechaEmision,
            hashXRP,
            hashAlgo,
            ipfsURI
        );
        // HTS mint for the academic NFT can be executed off-chain using this enriched payload.
    }

    function isCredentialHashUsed(bytes32 uniqueHash) external view returns (bool) {
        return isHashUsed[uniqueHash];
    }

    function getCertificado(bytes32 uniqueHash) external view returns (Certificado memory) {
        return certificados[uniqueHash];
    }
}
