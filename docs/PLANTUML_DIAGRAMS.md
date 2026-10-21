# Comprehensive PlantUML Diagrams for ReliefSphere

This document contains PlantUML code generated directly from the **currently implemented source code and features** of ReliefSphere.

---

## 1. Use Case Diagram (All Implemented Features)

```plantuml
@startuml ReliefSphere_UseCase_Diagram
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle stickman
skinparam backgroundColor white

actor "Donor" as Donor
actor "Recipient Organization" as Org
actor "Volunteer" as Vol
actor "System Admin" as Admin

rectangle "ReliefSphere Platform (Implemented System)" {
    
    ' Authentication & Profile
    usecase "Register & Login\n(Email / Google OAuth)" as UC_Auth
    usecase "Manage User Profile & Location" as UC_Profile
    usecase "Reset Password" as UC_ResetPass

    ' Donor Features
    usecase "Create General Item/Cash Donation" as UC_DonateGeneral
    usecase "Donate Directly to Requirement" as UC_DonateReq
    usecase "Donate to Relief Campaign" as UC_DonateCamp
    usecase "Browse Requirements & Campaigns" as UC_Browse
    usecase "Track Donation & Delivery Progress" as UC_Track

    ' Recipient Org Features
    usecase "Post Relief Requirement\n(Category, Qty, Urgency)" as UC_PostReq
    usecase "Create Disaster Relief Campaign" as UC_PostCamp
    usecase "Manage Requirements & Campaigns" as UC_ManageReqCamp
    usecase "View Incoming Donations & Matches" as UC_ViewIncoming

    ' Volunteer Features
    usecase "View & Accept Assigned Deliveries" as UC_AcceptDelivery
    usecase "Update Delivery Status & Upload Proof" as UC_UpdateProof
    usecase "View Completed Delivery History" as UC_VolHistory

    ' Shared System Features
    usecase "In-App Messaging / Chat" as UC_Chat
    usecase "Receive Real-time Notifications" as UC_Notify
    usecase "AI Multi-Factor Resource Matching" as UC_AIMatch

    ' Admin Features
    usecase "Verify Organizations & Volunteers" as UC_Verify
    usecase "Manage Users, Donors & Orgs" as UC_ManageUsers
    usecase "Monitor Donations, Requirements & Campaigns" as UC_MonitorSystem
    usecase "Assign & Oversee Deliveries" as UC_AdminDelivery
    usecase "View System Analytics & Reports" as UC_Analytics
    usecase "Configure Platform Settings" as UC_Settings
}

' Connections - Donor
Donor --> UC_Auth
Donor --> UC_Profile
Donor --> UC_ResetPass
Donor --> UC_DonateGeneral
Donor --> UC_DonateReq
Donor --> UC_DonateCamp
Donor --> UC_Browse
Donor --> UC_Track
Donor --> UC_Chat
Donor --> UC_Notify

' Connections - Recipient Org
Org --> UC_Auth
Org --> UC_Profile
Org --> UC_PostReq
Org --> UC_PostCamp
Org --> UC_ManageReqCamp
Org --> UC_ViewIncoming
Org --> UC_Chat
Org --> UC_Notify

' Connections - Volunteer
Vol --> UC_Auth
Vol --> UC_Profile
Vol --> UC_AcceptDelivery
Vol --> UC_UpdateProof
Vol --> UC_VolHistory
Vol --> UC_Chat
Vol --> UC_Notify

' Connections - Admin
Admin --> UC_Auth
Admin --> UC_Verify
Admin --> UC_ManageUsers
Admin --> UC_MonitorSystem
Admin --> UC_AdminDelivery
Admin --> UC_Analytics
Admin --> UC_Settings

' Automated Engine Includes
UC_DonateGeneral ..> UC_AIMatch : <<include>>
UC_PostReq ..> UC_AIMatch : <<include>>

@enduml
```

---

## 2. Class Diagram (Reflecting Backend Mongoose Schemas & Controllers)

```plantuml
@startuml ReliefSphere_Class_Diagram
skinparam classAttributeIconSize 0

class User {
    +ObjectId _id
    +String fullName
    +String email
    +String password
    +String phone
    +String role [donor, recipient_org, volunteer, admin]
    +Boolean isVerified
    +String avatar
    +String resetPasswordToken
    +Date resetPasswordExpires
}

class DonorModel {
    +ObjectId _id
    +ObjectId userId
    +String donorType
    +String address
    +Number latitude
    +Number longitude
}

class VolunteerModel {
    +ObjectId _id
    +ObjectId userId
    +Array<String> skills
    +String idDocument
    +String verificationStatus
}

class RecipientOrganization {
    +ObjectId _id
    +ObjectId userId
    +String orgName
    +String orgType
    +String registrationNumber
    +String verificationStatus
}

class Donation {
    +ObjectId _id
    +ObjectId donorId
    +ObjectId targetRequirementId
    +ObjectId targetCampaignId
    +String category
    +Number quantity
    +String unit
    +String donationType [item, monetary]
    +Number amount
    +String pickupAddress
    +Number matchScore
    +String status [pending, matched, in_transit, delivered, cancelled]
}

class Requirement {
    +ObjectId _id
    +ObjectId organizationId
    +String title
    +String category
    +Number requiredQuantity
    +Number fulfilledQuantity
    +String urgency [critical, high, medium, low]
    +String status [open, partially_fulfilled, fulfilled, closed]
}

class Campaign {
    +ObjectId _id
    +ObjectId organizationId
    +String title
    +String description
    +Number targetAmount
    +Number raisedAmount
    +Array<String> images
    +String status [active, completed, paused]
}

class Delivery {
    +ObjectId _id
    +ObjectId donationId
    +ObjectId volunteerId
    +String status [assigned, picked_up, in_transit, delivered]
    +Array<String> proofImages
    +String deliveryNotes
}

class ChatMessage {
    +ObjectId _id
    +ObjectId senderId
    +ObjectId receiverId
    +ObjectId relatedDonationId
    +String message
    +Boolean isRead
}

class Notification {
    +ObjectId _id
    +ObjectId userId
    +String title
    +String message
    +String type
    +Boolean isRead
}

User "1" -- "0..1" DonorModel
User "1" -- "0..1" VolunteerModel
User "1" -- "0..1" RecipientOrganization
DonorModel "1" -- "*" Donation
RecipientOrganization "1" -- "*" Requirement
RecipientOrganization "1" -- "*" Campaign
Donation "0..1" -- "1" Delivery
VolunteerModel "1" -- "*" Delivery
User "1" -- "*" ChatMessage
User "1" -- "*" Notification
@enduml
```

---

## 3. Sequence Diagram (Donation, AI Match Engine & Notification Flow)

```plantuml
@startuml ReliefSphere_Sequence_Diagram
autonumber
actor "Donor User" as Donor
participant "React Frontend\n(CreateDonation.jsx)" as FE
participant "Donation Controller\n(donationController.js)" as Controller
participant "AI Matching Engine\n(resourceMatcher.js)" as Matcher
database "MongoDB Storage" as DB
participant "Notification Service" as Notif
actor "Recipient Org" as Org

Donor -> FE: Fills Donation Form (Category, Qty, Pickup Location, Photos)
FE -> Controller: POST /api/donations (JWT + Upload Data)
Controller -> DB: Save new Donation (status: "pending")
Controller -> Matcher: matchDonationToRequirements(donation)
Matcher -> DB: Query Open Requirements matching Category
DB --> Matcher: Return Candidate Requirements
Matcher -> Matcher: Calculate Score (Category Weight + Urgency + Distance + Quantity)
Matcher --> Controller: Return Best Matched Requirement (Score >= Threshold)

alt Match Found
    Controller -> DB: Update Donation (status: "matched", matchScore)
    Controller -> DB: Update Requirement (status: "partially_fulfilled" / "fulfilled")
    Controller -> Notif: Trigger In-App Notification to Recipient Org
    Notif -> DB: Save Notification Record
    Notif -> Org: Real-time Socket / Toast Alert
    Controller --> FE: 201 Created (With Match Details)
    FE --> Donor: Display Success & Matched Org Details
else No Immediate Match
    Controller --> FE: 201 Created (Donation Queued for Future Match)
    FE --> Donor: Display Donation Saved Confirmation
end
@enduml
```

---

## 4. Activity Diagram (End-to-End Relief Lifecycle)

```plantuml
@startuml ReliefSphere_Activity_Diagram
start
:User signs up / logs in;
if (User Role?) then (Donor)
  :Option to create general donation or donate to campaign/requirement;
  :Submit Donation Details;
  :System executes AI Matching Algorithm;
  if (Matching Requirement Found?) then (yes)
    :Assign Status to "Matched";
    :Notify Recipient Organization;
    :Admin/System assigns Volunteer;
  else (no)
    :Keep in Pending Queue;
  endif
elseif (Recipient Organization)
  :Post Disaster Relief Requirement or Campaign;
  :System checks pending donations for matches;
elseif (Volunteer)
  :Browse Assigned Deliveries;
  :Accept Delivery Task;
  :Collect Supplies & Update Status to "In Transit";
  :Deliver Supplies & Upload Photo Proof;
  :System updates Donation & Delivery status to "Delivered";
else (Admin)
  :Verify Organization & Volunteer Profiles;
  :Monitor Platform Analytics & System Reports;
endif
stop
@enduml
```

---

## 5. Component Diagram (Full Architecture)

```plantuml
@startuml ReliefSphere_Component_Diagram
package "Frontend (React.js SPA)" {
    [Auth & User Menu Components] as C_Auth
    [Donor Dashboard Pages] as C_Donor
    [Organization Pages] as C_Org
    [Volunteer Pages] as C_Vol
    [Admin Analytics & Management] as C_Admin
    [Chat Modal & Notification Bell] as C_Chat
}

package "Backend API (Node.js / Express)" {
    [Auth Middleware & JWT Validator] as M_Auth
    [Donation Controller] as CTRL_Donation
    [Requirement Controller] as CTRL_Req
    [Campaign Controller] as CTRL_Camp
    [Delivery Controller] as CTRL_Del
    [Admin Controller] as CTRL_Admin
    [Chat & Notification Controller] as CTRL_Chat
    [AI Resource Matching Engine] as Engine_AI
}

database "MongoDB Database" {
    [Users & Profiles Collection]
    [Donations & Deliveries Collection]
    [Requirements & Campaigns Collection]
    [Chats & Notifications Collection]
}

cloud "External Cloud Services" {
    [Google OAuth API]
    [Cloudinary Storage (Images & Documents)]
}

C_Donor --> M_Auth : HTTP REST Calls
C_Org --> M_Auth : HTTP REST Calls
C_Vol --> M_Auth : HTTP REST Calls
C_Admin --> M_Auth : HTTP REST Calls
C_Chat --> CTRL_Chat : WebSockets / REST

M_Auth --> CTRL_Donation
M_Auth --> CTRL_Req
M_Auth --> CTRL_Camp
M_Auth --> CTRL_Del
M_Auth --> CTRL_Admin

CTRL_Donation --> Engine_AI : Execute Matching
CTRL_Req --> Engine_AI

CTRL_Donation --> [Donations & Deliveries Collection]
CTRL_Req --> [Requirements & Campaigns Collection]
CTRL_Admin --> [Users & Profiles Collection]

C_Auth --> [Google OAuth API]
CTRL_Donation --> [Cloudinary Storage (Images & Documents)]
@enduml
```

---

## 6. Deployment Diagram

```plantuml
@startuml ReliefSphere_Deployment_Diagram
node "Client Workspace" {
    node "Browser Device" {
        artifact "React Single Page Application" as ClientApp
    }
}

node "Application Server Container" {
    node "Node.js Environment" {
        component "Express REST API Server" as ExpressApp
        component "Mongoose ODM Layer" as Mongoose
        component "AI Resource Matching Module" as AIMatcher
    }
}

node "Database Server Container" {
    database "MongoDB Database Engine" as MongoInstance {
        storage "ReliefSphere DB Data"
    }
}

node "Third-Party Cloud Services" {
    component "Cloudinary CDN (Images & ID Uploads)" as Cloudinary
    component "Google Sign-In Authentication" as GoogleOAuth
}

ClientApp --> ExpressApp : HTTPS / REST JSON Requests
ClientApp --> GoogleOAuth : OAuth2 Authentication Token
ExpressApp --> Mongoose : Internal Queries
Mongoose --> MongoInstance : TCP Port 27017
ExpressApp --> Cloudinary : Upload Proofs & Images
@enduml
```
