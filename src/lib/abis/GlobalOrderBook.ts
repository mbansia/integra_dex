export const GLOBAL_ORDER_BOOK_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "trustedForwarder_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tUSDI_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "AddressInsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FailedInnerCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "maker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "sellToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "priceInIRL",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "priceInTUSDI",
        "type": "uint256"
      }
    ],
    "name": "AssetListed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum IGlobalOrderBook.Currency",
        "name": "currency",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bidPrice",
        "type": "uint256"
      }
    ],
    "name": "BidPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum IGlobalOrderBook.Currency",
        "name": "currency",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "CounterOffered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "name": "ListingCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "name": "NegotiationsExpired",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum IGlobalOrderBook.Currency",
        "name": "currency",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "finalPrice",
        "type": "uint256"
      }
    ],
    "name": "OfferAccepted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      }
    ],
    "name": "OfferRejected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum IGlobalOrderBook.Currency",
        "name": "currency",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TradeSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "actionType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "points",
        "type": "uint256"
      }
    ],
    "name": "XPAction",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_NEGOTIATION_ROUNDS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      }
    ],
    "name": "acceptOffer",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "newPrice",
        "type": "uint256"
      }
    ],
    "name": "counterOffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeRate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getActiveNegotiations",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "negotiationId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "enum IGlobalOrderBook.Currency",
            "name": "currency",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "currentPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "round",
            "type": "uint256"
          },
          {
            "internalType": "enum IGlobalOrderBook.NegotiationStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "lastUpdatedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct IGlobalOrderBook.Negotiation[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getAllOrders",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "maker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "sellToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "sellTokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "sellAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInIRL",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInTUSDI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "filledAmount",
            "type": "uint256"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderType",
            "name": "orderType",
            "type": "uint8"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderSide",
            "name": "side",
            "type": "uint8"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "filledBy",
            "type": "address"
          },
          {
            "internalType": "enum IGlobalOrderBook.Currency",
            "name": "filledCurrency",
            "type": "uint8"
          }
        ],
        "internalType": "struct IGlobalOrderBook.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      }
    ],
    "name": "getNegotiation",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "negotiationId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "enum IGlobalOrderBook.Currency",
            "name": "currency",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "currentPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "round",
            "type": "uint256"
          },
          {
            "internalType": "enum IGlobalOrderBook.NegotiationStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "lastUpdatedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct IGlobalOrderBook.Negotiation",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "name": "getOrder",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "maker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "sellToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "sellTokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "sellAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInIRL",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInTUSDI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "filledAmount",
            "type": "uint256"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderType",
            "name": "orderType",
            "type": "uint8"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderSide",
            "name": "side",
            "type": "uint8"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "filledBy",
            "type": "address"
          },
          {
            "internalType": "enum IGlobalOrderBook.Currency",
            "name": "filledCurrency",
            "type": "uint8"
          }
        ],
        "internalType": "struct IGlobalOrderBook.Order",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sellToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getOrderBook",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "maker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "sellToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "sellTokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "sellAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInIRL",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInTUSDI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "filledAmount",
            "type": "uint256"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderType",
            "name": "orderType",
            "type": "uint8"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderSide",
            "name": "side",
            "type": "uint8"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "filledBy",
            "type": "address"
          },
          {
            "internalType": "enum IGlobalOrderBook.Currency",
            "name": "filledCurrency",
            "type": "uint8"
          }
        ],
        "internalType": "struct IGlobalOrderBook.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "name": "getOrderNegotiations",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "negotiationId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "enum IGlobalOrderBook.Currency",
            "name": "currency",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "currentPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "round",
            "type": "uint256"
          },
          {
            "internalType": "enum IGlobalOrderBook.NegotiationStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "lastUpdatedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct IGlobalOrderBook.Negotiation[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getTradeHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "maker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "sellToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "sellTokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "sellAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInIRL",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceInTUSDI",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "filledAmount",
            "type": "uint256"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderType",
            "name": "orderType",
            "type": "uint8"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderSide",
            "name": "side",
            "type": "uint8"
          },
          {
            "internalType": "enum IGlobalOrderBook.OrderStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "filledBy",
            "type": "address"
          },
          {
            "internalType": "enum IGlobalOrderBook.Currency",
            "name": "filledCurrency",
            "type": "uint8"
          }
        ],
        "internalType": "struct IGlobalOrderBook.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserTokens",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "tokenAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "internalType": "struct GlobalOrderBook.UserToken[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "forwarder",
        "type": "address"
      }
    ],
    "name": "isTrustedForwarder",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sellToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "sellAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "sellTokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "priceInIRL",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "priceInTUSDI",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "listAsset",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "internalType": "enum IGlobalOrderBook.Currency",
        "name": "currency",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "bidPrice",
        "type": "uint256"
      }
    ],
    "name": "placeBid",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sellToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "priceInIRL",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "priceInTUSDI",
        "type": "uint256"
      },
      {
        "internalType": "enum IGlobalOrderBook.OrderSide",
        "name": "side",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "placeLimitOrder",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "internalType": "enum IGlobalOrderBook.Currency",
        "name": "currency",
        "type": "uint8"
      }
    ],
    "name": "placeMarketOrder",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "negotiationId",
        "type": "uint256"
      }
    ],
    "name": "rejectOffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rate",
        "type": "uint256"
      }
    ],
    "name": "setFeeRate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "treasury_",
        "type": "address"
      }
    ],
    "name": "setTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tUSDI",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "trustedForwarder",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;
