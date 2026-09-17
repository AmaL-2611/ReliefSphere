# UML DIAGRAMS & SYSTEM ARCHITECTURE
**Project:** ReliefSphere — Intelligent Resource Allocation & Disaster Relief Management Platform  
**Course Code:** 20INMCA509 — Mini Project 2  

---

## 1. Use Case Diagram

```mermaid
graph TD
    Donor(("Donor"))
    Org(("Recipient Organization"))
    Vol(("Volunteer"))
    Admin(("System Admin"))

    subgraph ReliefSphere System
        UC1["Register & Authenticate (JWT / Google)"]
        UC2["Post Donation (Category, Quantity, Location, Image)"]
        UC3["Post Requirement (Urgency, Beneficiaries, Location)"]
        UC4["Run Multi-Factor AI Matching Engine"]
        UC5["Accept / Reject Match"]
        UC6["Submit Volunteer Registration (Upload ID)"]
        UC7["Submit Organization Documents"]
        UC8["Verify Volunteer & Organization Documents"]
        UC9["Assign Delivery Task to Volunteer"]
        UC10["Update Delivery Status & Upload Proof of Delivery"]
        UC11["View Dashboard Analytics & System Logs"]
    end

    Donor --> UC1
    Donor --> UC2
    Donor --> UC5

    Org --> UC1
    Org --> UC3
    Org --> UC5
    Org --> UC7

    Vol --> UC1
    Vol --> UC6
    Vol --> UC10

    Admin --> UC8
    Admin --> UC9
    Admin --> UC11

    UC2 -.-> UC4
    UC3 -.-> UC4
```

---

## 2. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o| DONOR : "has profile"
    USER ||--o| VOLUNTEER : "has profile"
    USER ||--o| RECIPIENT_ORGANIZATION : "manages"
    DONOR ||--o{ DONATION : "posts"
    RECIPIENT_ORGANIZATION ||--o{ REQUIREMENT : "creates"
    DONATION }|--|{ REQUIREMENT : "matched via AI"
    DONATION ||--o| DELIVERY : "triggers"
    VOLUNTEER ||--o{ DELIVERY : "fulfills"
    USER ||--o{ NOTIFICATION : "receives"

    USER {
        ObjectId _id PK
        string fullName
        string email
        string role
        boolean isVerified
    }

    DONOR {
        ObjectId _id PK
        ObjectId userId FK
        string donorType
        string address
        float latitude
        float longitude
    }

    VOLUNTEER {
        ObjectId _id PK
        ObjectId userId FK
        string skills
        string idDocument
        string verificationStatus
    }

    RECIPIENT_ORGANIZATION {
        ObjectId _id PK
        ObjectId userId FK
        string orgName
        string orgType
        string verificationStatus
    }

    DONATION {
        ObjectId _id PK
        ObjectId donorId FK
        string category
        int quantity
        float matchScore
        string status
    }

    REQUIREMENT {
        ObjectId _id PK
        ObjectId organizationId FK
        string category
        int quantity
        string urgency
        string status
    }

    DELIVERY {
        ObjectId _id PK
        ObjectId donationId FK
        ObjectId volunteerId FK
        string status
        string proofImages
    }
```

---

## 3. Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId id
        +String fullName
        +String email
        +String role
        +Boolean isVerified
        +login()
        +resetPassword()
    }

    class Donor {
        +ObjectId id
        +ObjectId userId
        +String donorType
        +String address
        +Double latitude
        +Double longitude
        +createDonation()
    }

    class Volunteer {
        +ObjectId id
        +ObjectId userId
        +Array skills
        +String verificationStatus
        +String idDocument
        +acceptDelivery()
        +uploadProof()
    }

    class RecipientOrganization {
        +ObjectId id
        +ObjectId userId
        +String orgName
        +String orgType
        +String verificationStatus
        +postRequirement()
    }

    class Donation {
        +ObjectId id
        +String category
        +Number quantity
        +Number matchScore
        +String status
        +save()
    }

    class Requirement {
        +ObjectId id
        +String category
        +Number quantity
        +String urgency
        +String status
    }

    class Delivery {
        +ObjectId id
        +ObjectId donationId
        +ObjectId volunteerId
        +String status
        +Array proofImages
        +updateStatus()
    }

    class AIMatcher {
        +calculateMatchScore(donation, requirement)
        +haversineDistance(lat1, lon1, lat2, lon2)
        +matchDonationToRequirements(donation)
    }

    User <|-- Donor
    User <|-- Volunteer
    User <|-- RecipientOrganization
    Donor "1" -- "*" Donation
    RecipientOrganization "1" -- "*" Requirement
    Donation "1" -- "0..1" Delivery
    Volunteer "1" -- "*" Delivery
    AIMatcher ..> Donation
    AIMatcher ..> Requirement
```

---

## 4. Sequence Diagram: Donation Posting & Automated AI Matching

```mermaid
sequenceDiagram
    autonumber
    actor Donor as Donor User
    participant FE as React Frontend
    participant BE as Express API Controller
    participant Engine as AI Matching Engine (aiMatcher)
    participant DB as MongoDB
    actor Org as Recipient Organization

    Donor->>FE: Fills donation details (Category, Quantity, Pickup Address, Image)
    FE->>BE: POST /api/donations (JWT Header + Form Data)
    BE->>DB: Save new Donation (Status: "pending")
    BE->>Engine: matchDonationToRequirements(donation)
    Engine->>DB: Query open Requirements matching category
    DB-->>Engine: Return Candidate Requirements
    Engine->>Engine: Compute Multi-Factor Scores (Category, Quantity, Urgency, Distance)
    Engine-->>BE: Return Best Match (Score >= 40%)
    BE->>DB: Update Donation (Status: "matched", matchScore, matchedRequirement)
    BE->>DB: Update Requirement (Status: "matched")
    BE->>DB: Create Notification for Recipient Organization
    BE-->>FE: Return 201 Created with Match Confirmation
    FE-->>Donor: Display Success Alert & Match Details
    BE--)Org: Push Real-Time In-App Alert
```

---

## 5. Data Flow Diagrams (DFD)

### 5.1 Level 0: Context Diagram
```mermaid
graph LR
    Donor[Donor] -->|Donation Post & Location| ReliefSphere((ReliefSphere Platform))
    Org[Recipient Organization] -->|Requirements & Verification Docs| ReliefSphere
    Volunteer[Volunteer] -->|Skills & ID Proof| ReliefSphere
    
    ReliefSphere -->|Match Alerts & Delivery Tasks| Donor
    ReliefSphere -->|Matched Supply Status| Org
    ReliefSphere -->|Assigned Deliveries & Route Info| Volunteer
    Admin[Admin] <-->|Verification & System Management| ReliefSphere
```

### 5.2 Level 1: System Data Flow Diagram
```mermaid
graph TD
    P1[1.0 User Authentication & Verification]
    P2[2.0 Requirement Management]
    P3[3.0 Donation Processing & AI Matching]
    P4[4.0 Logistics & Volunteer Dispatch]
    P5[5.0 Notification & Reporting]

    D1[(D1: Users & Profiles)]
    D2[(D2: Requirements)]
    D3[(D3: Donations)]
    D4[(D4: Deliveries)]

    User -->|Credentials & Docs| P1
    P1 --> D1

    Org -->|Requirement Details| P2
    P2 --> D2

    Donor -->|Donation Item| P3
    P3 --> D3
    D2 -->|Read Open Reqs| P3
    P3 -->|Write Match Score| D3

    Admin -->|Assign Volunteer| P4
    P4 --> D4
    Volunteer -->|Upload Proof of Delivery| P4

    P3 --> P5
    P4 --> P5
    P5 -->|Alerts| User
```
